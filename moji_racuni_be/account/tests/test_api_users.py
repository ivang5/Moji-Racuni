"""
Testovi: upravljanje korisnicima (filter, detalji, izmena, lozinka).

Prijavljen korisnik bez prava na akciju dobija 403, a 401 samo neprijavljen korisnik. Tuđi nalog
se REGULAR korisniku ponaša kao nepostojeći (404).
"""
import jwt
import pytest
from django.conf import settings

from account.models import User
from account.tests.factories import DEFAULT_PASSWORD, UserFactory

pytestmark = pytest.mark.django_db

USER_FIELDS = {"id", "username", "email", "role", "date_joined", "is_active"}


# ----------------------------------------------------------
#  Uklonjeni endpoint-i (FE ih ne koristi)
# ----------------------------------------------------------

@pytest.mark.parametrize(
    "method, path",
    [
        ("get", "/api/users/"),
        ("delete", "/api/users/{id}/"),
    ],
    ids=["lista", "brisanje"],
)
def test_removed_user_endpoints_return_405(admin_api_client, regular_user, method, path):
    response = getattr(admin_api_client, method)(path.format(id=regular_user.id))

    assert response.status_code == 405
    assert User.objects.filter(id=regular_user.id).exists()


@pytest.mark.parametrize("client_fixture", ["admin_api_client", "regular_client", "api_client"])
def test_create_admin_endpoint_is_removed(request, client_fixture):
    client = request.getfixturevalue(client_fixture)

    response = client.post("/api/admins/", {"username": "haker", "email": "h@example.com", "role": "ADMIN"}, format="json")

    assert response.status_code == 404
    assert not User.objects.filter(username="haker").exists()


# ----------------------------------------------------------
#  GET /api/users/filter/ (ADMIN, stranica "Korisnici")
# ----------------------------------------------------------

FILTER_ALL = {"id": "%", "username": "%", "email": "%", "orderBy": "id", "ascendingOrder": "asc"}


def test_users_filter_returns_only_regular_users_paginated(admin_api_client, admin_user):
    users = [UserFactory(username=f"korisnik_{i:02d}") for i in range(13)]

    response = admin_api_client.get("/api/users/filter/", FILTER_ALL)

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"pageCount", "pageNum", "users"}
    assert body["pageCount"] == 2
    assert body["pageNum"] == 1
    #* 12 po stranici, samo REGULAR (admin se ne prikazuje), sortirano po id rastuće
    assert [u["id"] for u in body["users"]] == [u.id for u in users[:12]]

    page2 = admin_api_client.get("/api/users/filter/", {**FILTER_ALL, "page": 2}).json()
    assert page2["pageNum"] == 2
    assert [u["username"] for u in page2["users"]] == ["korisnik_12"]

    #* Nepostojeća ili neispravna stranica -> prva stranica
    assert admin_api_client.get("/api/users/filter/", {**FILTER_ALL, "page": 99}).json()["pageNum"] == 1
    assert admin_api_client.get("/api/users/filter/", {**FILTER_ALL, "page": "x"}).json()["pageNum"] == 1


def test_users_filter_by_username_and_ordering(admin_api_client):
    UserFactory(username="marko", email="marko@example.com")
    UserFactory(username="marija", email="marija@example.com")
    UserFactory(username="jovan", email="jovan@example.com")

    response = admin_api_client.get(
        "/api/users/filter/", {**FILTER_ALL, "username": "mar", "orderBy": "username", "ascendingOrder": "desc"}
    )

    assert [u["username"] for u in response.json()["users"]] == ["marko", "marija"]


def test_users_filter_row_shape(admin_api_client, regular_user):
    row = admin_api_client.get("/api/users/filter/", FILTER_ALL).json()["users"][0]

    #* Raw SQL sa eksplicitnim kolonama (bez heša lozinke i internih polja); is_active je 0/1
    assert set(row) == USER_FIELDS
    assert row["username"] == "regular"
    assert row["role"] == "REGULAR"
    assert row["is_active"] == 1


def test_users_filter_does_not_expose_password_hash(admin_api_client, regular_user):
    row = admin_api_client.get("/api/users/filter/", FILTER_ALL).json()["users"][0]

    assert "password" not in row


def test_users_filter_without_required_params_returns_400(admin_api_client):
    response = admin_api_client.get("/api/users/filter/", {"id": "%"})

    assert response.status_code == 400


def test_users_filter_for_regular_returns_403(regular_client):
    assert regular_client.get("/api/users/filter/", FILTER_ALL).status_code == 403


def test_users_filter_for_anonymous_returns_401(api_client):
    assert api_client.get("/api/users/filter/", FILTER_ALL).status_code == 401


# ----------------------------------------------------------
#  GET /api/users/<id>/
# ----------------------------------------------------------

def test_user_retrieve_own_profile(regular_client, regular_user):
    response = regular_client.get(f"/api/users/{regular_user.id}/")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == USER_FIELDS
    assert body["id"] == regular_user.id
    assert body["username"] == "regular"
    assert body["role"] == "REGULAR"


def test_user_retrieve_other_user_as_regular_returns_404(regular_client, other_regular_user):
    assert regular_client.get(f"/api/users/{other_regular_user.id}/").status_code == 404


def test_user_retrieve_as_anonymous_returns_401(api_client, regular_user):
    assert api_client.get(f"/api/users/{regular_user.id}/").status_code == 401


def test_user_retrieve_any_user_as_admin(admin_api_client, regular_user):
    response = admin_api_client.get(f"/api/users/{regular_user.id}/")

    assert response.status_code == 200
    assert response.json()["username"] == "regular"


def test_user_retrieve_unknown_user_as_admin_returns_404(admin_api_client):
    assert admin_api_client.get("/api/users/999999/").status_code == 404


# ----------------------------------------------------------
#  PUT /api/users/<id>/
# ----------------------------------------------------------

def test_user_update_own_username_and_email(regular_client, regular_user):
    #* Isti oblik kao Profile.tsx
    payload = {"username": "regular_novo", "email": "novo@example.com", "is_active": False}

    response = regular_client.put(f"/api/users/{regular_user.id}/", payload, format="json")

    assert response.status_code == 200
    assert response.json()["username"] == "regular_novo"
    assert response.json()["email"] == "novo@example.com"
    regular_user.refresh_from_db()
    assert regular_user.username == "regular_novo"
    #* REGULAR ne može sam sebe da (de)aktivira: is_active se ignoriše
    assert regular_user.is_active is True


def test_user_update_to_taken_username_returns_409(regular_client, regular_user, other_regular_user):
    response = regular_client.put(
        f"/api/users/{regular_user.id}/", {"username": "other_regular", "email": "x@example.com"}, format="json"
    )

    assert response.status_code == 409
    regular_user.refresh_from_db()
    assert regular_user.username == "regular"


def test_user_update_without_email_returns_400(regular_client, regular_user):
    response = regular_client.put(f"/api/users/{regular_user.id}/", {"username": "regular"}, format="json")

    assert response.status_code == 400


@pytest.mark.parametrize("email", ["nije-email", "OTHER_REGULAR@example.com"], ids=["nevalidan", "zauzet"])
def test_user_update_with_invalid_or_taken_email_returns_400(regular_client, regular_user, other_regular_user, email):
    response = regular_client.put(f"/api/users/{regular_user.id}/", {"username": "regular", "email": email}, format="json")

    assert response.status_code == 400
    assert "email" in response.json()
    regular_user.refresh_from_db()
    assert regular_user.email == "regular@example.com"


def test_user_update_keeps_own_email(regular_client, regular_user):
    response = regular_client.put(
        f"/api/users/{regular_user.id}/", {"username": "regular", "email": "Regular@example.com"}, format="json"
    )

    assert response.status_code == 200


def test_user_update_ignores_read_only_fields(regular_client, regular_user):
    payload = {"username": "regular", "email": "regular@example.com", "role": "ADMIN", "date_joined": "2000-01-01"}

    response = regular_client.put(f"/api/users/{regular_user.id}/", payload, format="json")

    assert response.status_code == 200
    regular_user.refresh_from_db()
    assert regular_user.role == "REGULAR"
    assert regular_user.date_joined.year != 2000


def test_user_update_other_user_as_regular_returns_404(regular_client, other_regular_user):
    response = regular_client.put(
        f"/api/users/{other_regular_user.id}/", {"username": "preuzet", "email": "x@example.com"}, format="json"
    )

    assert response.status_code == 404
    other_regular_user.refresh_from_db()
    assert other_regular_user.username == "other_regular"


def test_admin_can_block_and_unblock_user(admin_api_client, regular_user):
    #* Isti oblik kao toggleUserBlock u Users.tsx
    payload = {"username": "regular", "first_name": "", "last_name": "", "email": "regular@example.com"}

    blocked = admin_api_client.put(f"/api/users/{regular_user.id}/", {**payload, "is_active": False}, format="json")
    assert blocked.status_code == 200
    assert blocked.json()["is_active"] is False
    regular_user.refresh_from_db()
    assert regular_user.is_active is False

    unblocked = admin_api_client.put(f"/api/users/{regular_user.id}/", {**payload, "is_active": True}, format="json")
    assert unblocked.json()["is_active"] is True


def test_blocked_user_access_token_stops_working(admin_api_client, auth_client, regular_user):
    client = auth_client(regular_user)
    payload = {"username": "regular", "email": "regular@example.com", "is_active": False}

    admin_api_client.put(f"/api/users/{regular_user.id}/", payload, format="json")

    assert client.get(f"/api/users/{regular_user.id}/").status_code == 401


def test_admin_cannot_deactivate_own_account(admin_api_client, admin_user):
    payload = {"username": "admin", "email": "admin@example.com", "is_active": False}

    response = admin_api_client.put(f"/api/users/{admin_user.id}/", payload, format="json")

    assert response.status_code == 200
    admin_user.refresh_from_db()
    assert admin_user.is_active is True


# ----------------------------------------------------------
#  PUT /api/users/update-password/<id>/
# ----------------------------------------------------------

NEW_PASSWORD = "Nova-lozinka-456"


def _password_payload(**overrides):
    #* Isti oblik kao Profile.tsx (passRepeat BE ignoriše)
    payload = {"currentPassword": DEFAULT_PASSWORD, "password": NEW_PASSWORD, "passRepeat": NEW_PASSWORD}
    payload.update(overrides)
    return payload


def test_update_own_password(regular_client, regular_user, api_client):
    response = regular_client.put(f"/api/users/update-password/{regular_user.id}/", _password_payload(), format="json")

    assert response.status_code == 200
    #* Tekuća sesija dobija nov par tokena (stari refresh tokeni su poništeni)
    assert set(response.json()) == {"access", "refresh"}
    claims = jwt.decode(response.json()["access"], settings.SECRET_KEY, algorithms=["HS256"])
    assert claims["user_id"] == str(regular_user.id)
    regular_user.refresh_from_db()
    assert regular_user.check_password(NEW_PASSWORD)
    assert api_client.post(
        "/api/token/", {"username": "regular", "password": NEW_PASSWORD}, format="json"
    ).status_code == 200


def test_update_password_blacklists_existing_refresh_tokens(regular_client, regular_user, api_client):
    old = api_client.post("/api/token/", {"username": "regular", "password": DEFAULT_PASSWORD}, format="json").json()

    new = regular_client.put(
        f"/api/users/update-password/{regular_user.id}/", _password_payload(), format="json"
    ).json()

    assert api_client.post("/api/token/refresh/", {"refresh": old["refresh"]}, format="json").status_code == 401
    assert api_client.post("/api/token/refresh/", {"refresh": new["refresh"]}, format="json").status_code == 200


def test_update_password_without_password_returns_400(regular_client, regular_user):
    response = regular_client.put(f"/api/users/update-password/{regular_user.id}/", {}, format="json")

    assert response.status_code == 400


def test_update_password_of_other_user_as_regular_returns_404(regular_client, other_regular_user):
    response = regular_client.put(
        f"/api/users/update-password/{other_regular_user.id}/", _password_payload(), format="json"
    )

    assert response.status_code == 404
    other_regular_user.refresh_from_db()
    assert other_regular_user.check_password(DEFAULT_PASSWORD)


def test_admin_cannot_change_password_of_other_user(admin_api_client, regular_user):
    #* Lozinku menja samo vlasnik naloga (uz trenutnu lozinku)
    response = admin_api_client.put(f"/api/users/update-password/{regular_user.id}/", _password_payload(), format="json")

    assert response.status_code == 404
    regular_user.refresh_from_db()
    assert regular_user.check_password(DEFAULT_PASSWORD)


@pytest.mark.parametrize("current", [None, "pogresna-lozinka"], ids=["bez-trenutne", "pogresna-trenutna"])
def test_update_own_password_requires_current_password(regular_client, regular_user, current):
    payload = _password_payload(currentPassword=current)
    if current is None:
        del payload["currentPassword"]

    response = regular_client.put(f"/api/users/update-password/{regular_user.id}/", payload, format="json")

    assert response.status_code == 400
    assert "currentPassword" in response.json()
    regular_user.refresh_from_db()
    assert regular_user.check_password(DEFAULT_PASSWORD)


def test_update_own_password_rejects_weak_password(regular_client, regular_user):
    response = regular_client.put(
        f"/api/users/update-password/{regular_user.id}/", _password_payload(password="12345678"), format="json"
    )

    assert response.status_code == 400
    assert response.json()["password"] == [
        "Ova lozinka je među najčešće korišćenim lozinkama.",
        "Ova lozinka sadrži samo cifre.",
    ]
    regular_user.refresh_from_db()
    assert regular_user.check_password(DEFAULT_PASSWORD)


def test_update_password_is_throttled(regular_client, regular_user, monkeypatch):
    from rest_framework.throttling import ScopedRateThrottle

    monkeypatch.setitem(ScopedRateThrottle.THROTTLE_RATES, "password", "2/min")
    url = f"/api/users/update-password/{regular_user.id}/"
    payload = _password_payload(currentPassword="pogresna-lozinka")

    statuses = [regular_client.put(url, payload, format="json").status_code for _ in range(3)]

    assert statuses == [400, 400, 429]
