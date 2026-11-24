"""
Karakterizacioni testovi: JWT prijava/refresh, registracija, provera postojanja korisnika.

Beleže TRENUTNO ponašanje API-ja (status kodovi, oblik odgovora). Nebezbedno ponašanje nije
zaključano kao ispravno: za njega postoje xfail testovi sa željenim ponašanjem.
"""
import jwt
import pytest
from django.conf import settings

from account.models import User
from account.tests.factories import DEFAULT_PASSWORD, UserFactory

pytestmark = pytest.mark.django_db


def _claims(token):
    return jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])


# ----------------------------------------------------------
#  POST /api/token/
# ----------------------------------------------------------

def test_token_obtain_returns_access_and_refresh_with_custom_claims(api_client, regular_user):
    response = api_client.post(
        "/api/token/", {"username": "regular", "password": DEFAULT_PASSWORD}, format="json"
    )

    assert response.status_code == 200
    assert set(response.json()) == {"access", "refresh"}
    claims = _claims(response.json()["access"])
    assert claims["token_type"] == "access"
    assert claims["user_id"] == regular_user.id
    assert claims["username"] == "regular"
    assert claims["role"] == "REGULAR"


def test_token_obtain_for_admin_has_admin_role_claim(api_client, admin_user):
    response = api_client.post(
        "/api/token/", {"username": "admin", "password": DEFAULT_PASSWORD}, format="json"
    )

    assert response.status_code == 200
    assert _claims(response.json()["access"])["role"] == "ADMIN"


@pytest.mark.parametrize(
    "username, password",
    [("regular", "pogresna-lozinka"), ("ne_postoji", DEFAULT_PASSWORD)],
    ids=["pogresna-lozinka", "nepostojeci-korisnik"],
)
def test_token_obtain_with_bad_credentials_returns_401(api_client, regular_user, username, password):
    response = api_client.post("/api/token/", {"username": username, "password": password}, format="json")

    assert response.status_code == 401
    assert response.json() == {"detail": "No active account found with the given credentials"}


def test_token_obtain_for_inactive_user_returns_401(api_client):
    UserFactory(username="blokiran", is_active=False)

    response = api_client.post(
        "/api/token/", {"username": "blokiran", "password": DEFAULT_PASSWORD}, format="json"
    )

    assert response.status_code == 401


# ----------------------------------------------------------
#  POST /api/token/refresh/
# ----------------------------------------------------------

def _obtain(api_client, username):
    return api_client.post(
        "/api/token/", {"username": username, "password": DEFAULT_PASSWORD}, format="json"
    ).json()


def test_token_refresh_rotates_refresh_token_and_keeps_claims(api_client, regular_user):
    tokens = _obtain(api_client, "regular")

    response = api_client.post("/api/token/refresh/", {"refresh": tokens["refresh"]}, format="json")

    assert response.status_code == 200
    #* ROTATE_REFRESH_TOKENS=True: uz novi access dolazi i novi refresh token
    assert set(response.json()) == {"access", "refresh"}
    assert response.json()["refresh"] != tokens["refresh"]
    claims = _claims(response.json()["access"])
    assert claims["username"] == "regular"
    assert claims["role"] == "REGULAR"


def test_token_refresh_with_rotated_refresh_token_returns_401(api_client, regular_user):
    tokens = _obtain(api_client, "regular")
    api_client.post("/api/token/refresh/", {"refresh": tokens["refresh"]}, format="json")

    #* BLACKLIST_AFTER_ROTATION=True: stari refresh token je na crnoj listi
    response = api_client.post("/api/token/refresh/", {"refresh": tokens["refresh"]}, format="json")

    assert response.status_code == 401
    assert response.json()["code"] == "token_not_valid"


def test_token_refresh_with_invalid_token_returns_401(api_client):
    response = api_client.post("/api/token/refresh/", {"refresh": "nije-token"}, format="json")

    assert response.status_code == 401
    assert response.json()["code"] == "token_not_valid"


def test_protected_endpoint_without_token_returns_401(api_client):
    response = api_client.get("/api/receipts/last/")

    assert response.status_code == 401


# ----------------------------------------------------------
#  POST /api/users/ (registracija)
# ----------------------------------------------------------

def _registration_payload(**overrides):
    #* Isti oblik kao registerUser u moji_racuni_fe/src/context/AuthContext.tsx
    payload = {
        "email": "novi@example.com",
        "username": "novi",
        "password": "Nova-lozinka-123",
        "role": "REGULAR",
        "date_joined": "2022-11-12",
        "is_active": True,
    }
    payload.update(overrides)
    return payload


def test_registration_creates_regular_user(api_client):
    response = api_client.post("/api/users/", _registration_payload(), format="json")

    assert response.status_code == 201
    body = response.json()
    assert set(body) == {"id", "username", "email", "role", "date_joined", "is_active"}
    assert body["username"] == "novi"
    assert body["email"] == "novi@example.com"
    assert body["role"] == "REGULAR"
    assert body["is_active"] is True
    user = User.objects.get(username="novi")
    assert user.check_password("Nova-lozinka-123")
    assert not user.is_superuser and not user.is_staff
    #* Nov korisnik može odmah da se prijavi (FE posle registracije automatski prijavljuje korisnika)
    login = api_client.post("/api/token/", {"username": "novi", "password": "Nova-lozinka-123"}, format="json")
    assert login.status_code == 200


def test_registration_cannot_create_admin_via_role_field(api_client):
    response = api_client.post("/api/users/", _registration_payload(role="ADMIN"), format="json")

    assert response.status_code == 201
    assert response.json()["role"] == "REGULAR"
    assert User.objects.get(username="novi").role == "REGULAR"


def test_registration_with_existing_username_returns_409(api_client, regular_user):
    response = api_client.post("/api/users/", _registration_payload(username="regular"), format="json")

    assert response.status_code == 409
    assert User.objects.filter(username="regular").count() == 1


def test_registration_without_password_returns_400(api_client):
    payload = _registration_payload()
    del payload["password"]

    response = api_client.post("/api/users/", payload, format="json")

    assert response.status_code == 400
    assert "password" in response.json()
    assert not User.objects.filter(username="novi").exists()


@pytest.mark.xfail(strict=True, reason="Bezbednosni propust: is_active pri registraciji ne sme da zadaje klijent")
def test_registration_ignores_client_supplied_is_active(api_client):
    response = api_client.post("/api/users/", _registration_payload(is_active=False), format="json")

    assert response.status_code == 201
    assert User.objects.get(username="novi").is_active is True


@pytest.mark.xfail(strict=True, reason="Bezbednosni propust: date_joined pri registraciji ne sme da zadaje klijent")
def test_registration_ignores_client_supplied_date_joined(api_client):
    api_client.post("/api/users/", _registration_payload(date_joined="2000-01-01"), format="json")

    assert User.objects.get(username="novi").date_joined.year != 2000


@pytest.mark.xfail(strict=True, reason="Bezbednosni propust: registracija mora da primeni AUTH_PASSWORD_VALIDATORS")
def test_registration_rejects_weak_password(api_client):
    response = api_client.post("/api/users/", _registration_payload(password="1"), format="json")

    assert response.status_code == 400
    assert not User.objects.filter(username="novi").exists()


# ----------------------------------------------------------
#  GET /api/users/<username>/ (provera postojanja, bez prijave)
# ----------------------------------------------------------

def test_user_exists_returns_true_for_existing_username(api_client, regular_user):
    response = api_client.get("/api/users/regular/")

    assert response.status_code == 200
    assert response.json() is True


def test_user_exists_returns_404_for_unknown_username(api_client):
    response = api_client.get("/api/users/ne_postoji/")

    assert response.status_code == 404


@pytest.mark.xfail(strict=True, reason="Bezbednosni propust: endpoint omogućava enumeraciju korisničkih imena bez prijave")
def test_anonymous_cannot_enumerate_usernames(api_client, regular_user):
    existing = api_client.get("/api/users/regular/")
    missing = api_client.get("/api/users/ne_postoji/")

    assert existing.status_code == missing.status_code
