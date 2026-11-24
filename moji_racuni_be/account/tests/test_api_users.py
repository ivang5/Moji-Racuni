"""
Karakterizacioni testovi: upravljanje korisnicima (lista, filter, detalji, izmena, lozinka,
brisanje, kreiranje admina).
"""
import pytest

from account.models import User
from account.tests.factories import DEFAULT_PASSWORD, UserFactory

pytestmark = pytest.mark.django_db

USER_FIELDS = {"id", "username", "email", "role", "date_joined", "is_active"}


# ----------------------------------------------------------
#  GET /api/users/
# ----------------------------------------------------------

def test_users_list_for_admin_returns_all_users(admin_api_client, admin_user, regular_user, other_regular_user):
    response = admin_api_client.get("/api/users/")

    assert response.status_code == 200
    assert sorted(u["username"] for u in response.json()) == ["admin", "other_regular", "regular"]
    assert all(set(u) == USER_FIELDS for u in response.json())


def test_users_list_for_regular_returns_401(regular_client):
    assert regular_client.get("/api/users/").status_code == 401


def test_users_list_for_anonymous_returns_401(api_client):
    assert api_client.get("/api/users/").status_code == 401


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

    #* Raw SQL (SELECT *): sve kolone tabele account_user
    assert set(row) == {
        "id", "password", "last_login", "is_superuser", "username", "first_name", "last_name",
        "email", "is_staff", "is_active", "date_joined", "role",
    }
    assert row["username"] == "regular"
    assert row["role"] == "REGULAR"


@pytest.mark.xfail(strict=True, reason="Bezbednosni propust: filter korisnika vraća heš lozinke (SELECT * iz account_user)")
def test_users_filter_does_not_expose_password_hash(admin_api_client, regular_user):
    row = admin_api_client.get("/api/users/filter/", FILTER_ALL).json()["users"][0]

    assert "password" not in row


def test_users_filter_without_required_params_returns_400(admin_api_client):
    response = admin_api_client.get("/api/users/filter/", {"id": "%"})

    assert response.status_code == 400


def test_users_filter_for_regular_returns_401(regular_client):
    assert regular_client.get("/api/users/filter/", FILTER_ALL).status_code == 401


@pytest.mark.xfail(strict=True, reason="Bezbednosni propust: neprijavljen korisnik dobija 500 (AttributeError) umesto 401")
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


def test_user_retrieve_other_user_as_regular_returns_401(regular_client, other_regular_user):
    assert regular_client.get(f"/api/users/{other_regular_user.id}/").status_code == 401


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


def test_user_update_other_user_as_regular_returns_401(regular_client, other_regular_user):
    response = regular_client.put(
        f"/api/users/{other_regular_user.id}/", {"username": "preuzet", "email": "x@example.com"}, format="json"
    )

    assert response.status_code == 401
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


# ----------------------------------------------------------
#  PUT /api/users/update-password/<id>/
# ----------------------------------------------------------

def test_update_own_password(regular_client, regular_user, api_client):
    #* Isti oblik kao Profile.tsx (passRepeat BE ignoriše)
    response = regular_client.put(
        f"/api/users/update-password/{regular_user.id}/",
        {"password": "Nova-lozinka-456", "passRepeat": "Nova-lozinka-456"},
        format="json",
    )

    assert response.status_code == 200
    assert set(response.json()) == USER_FIELDS
    regular_user.refresh_from_db()
    assert regular_user.check_password("Nova-lozinka-456")
    assert api_client.post(
        "/api/token/", {"username": "regular", "password": "Nova-lozinka-456"}, format="json"
    ).status_code == 200


def test_update_password_without_password_returns_400(regular_client, regular_user):
    response = regular_client.put(f"/api/users/update-password/{regular_user.id}/", {}, format="json")

    assert response.status_code == 400


def test_update_password_of_other_user_as_regular_returns_401(regular_client, other_regular_user):
    response = regular_client.put(
        f"/api/users/update-password/{other_regular_user.id}/", {"password": "Preuzeto-123"}, format="json"
    )

    assert response.status_code == 401
    other_regular_user.refresh_from_db()
    assert other_regular_user.check_password(DEFAULT_PASSWORD)


@pytest.mark.xfail(strict=True, reason="Bezbednosni propust: promena sopstvene lozinke mora da traži trenutnu lozinku")
def test_update_own_password_requires_current_password(regular_client, regular_user):
    response = regular_client.put(
        f"/api/users/update-password/{regular_user.id}/", {"password": "Nova-lozinka-456"}, format="json"
    )

    assert response.status_code == 400
    regular_user.refresh_from_db()
    assert regular_user.check_password(DEFAULT_PASSWORD)


# ----------------------------------------------------------
#  DELETE /api/users/<id>/
# ----------------------------------------------------------

def test_admin_deletes_user(admin_api_client, regular_user):
    response = admin_api_client.delete(f"/api/users/{regular_user.id}/")

    assert response.status_code == 204
    assert not User.objects.filter(id=regular_user.id).exists()


def test_admin_delete_unknown_user_returns_404(admin_api_client):
    assert admin_api_client.delete("/api/users/999999/").status_code == 404


def test_regular_cannot_delete_user(regular_client, other_regular_user):
    response = regular_client.delete(f"/api/users/{other_regular_user.id}/")

    assert response.status_code == 401
    assert User.objects.filter(id=other_regular_user.id).exists()


# ----------------------------------------------------------
#  POST /api/admins/
# ----------------------------------------------------------

def test_admin_creates_admin(admin_api_client):
    response = admin_api_client.post(
        "/api/admins/", {"username": "admin2", "email": "admin2@example.com", "role": "ADMIN"}, format="json"
    )

    assert response.status_code == 201
    assert response.json()["role"] == "ADMIN"
    assert User.objects.get(username="admin2").role == "ADMIN"
    #* Napomena: AdminSerializer nema polje password, pa novi admin nema upotrebljivu lozinku


def test_admin_create_with_existing_username_returns_409(admin_api_client, regular_user):
    response = admin_api_client.post(
        "/api/admins/", {"username": "regular", "email": "x@example.com", "role": "ADMIN"}, format="json"
    )

    assert response.status_code == 409


@pytest.mark.parametrize("client_fixture", ["regular_client", "api_client"])
def test_non_admin_cannot_create_admin(request, client_fixture):
    client = request.getfixturevalue(client_fixture)

    response = client.post("/api/admins/", {"username": "haker", "email": "h@example.com", "role": "ADMIN"}, format="json")

    assert response.status_code == 401
    assert not User.objects.filter(username="haker").exists()
