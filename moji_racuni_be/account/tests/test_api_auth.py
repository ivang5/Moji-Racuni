"""
Testovi: JWT prijava/refresh/odjava, registracija, zaštita od enumeracije i brute-force-a.
"""
import jwt
import pytest
from django.conf import settings
from rest_framework.throttling import ScopedRateThrottle

from account.api.views import MyTokenObtainPairSerializer
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
    #* simplejwt (>= 5.5.1) user_id claim uvek upisuje kao string; FE ga pretvara u broj (useAuthUser)
    assert claims["user_id"] == str(regular_user.id)
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


def test_token_with_numeric_user_id_claim_still_refreshes_and_authenticates(api_client, regular_user):
    #* Starije verzije simplejwt-a su user_id upisivale kao broj; takve sesije moraju i dalje da rade
    refresh = MyTokenObtainPairSerializer.get_token(regular_user)
    refresh["user_id"] = regular_user.id

    response = api_client.post("/api/token/refresh/", {"refresh": str(refresh)}, format="json")

    assert response.status_code == 200
    access = response.json()["access"]
    #* Rotacija kopira claim-ove, pa i novi tokeni zadržavaju broj
    assert _claims(access)["user_id"] == regular_user.id
    assert _claims(response.json()["refresh"])["user_id"] == regular_user.id
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
    assert api_client.get(f"/api/users/{regular_user.id}/").status_code == 200


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


def test_token_refresh_of_deleted_user_returns_401(api_client, regular_user):
    tokens = _obtain(api_client, "regular")
    regular_user.delete()

    response = api_client.post("/api/token/refresh/", {"refresh": tokens["refresh"]}, format="json")

    assert response.status_code == 401
    assert response.json() == {"detail": "No active account found for the given token."}


def test_token_refresh_of_blocked_user_returns_401(api_client, regular_user):
    tokens = _obtain(api_client, "regular")
    regular_user.is_active = False
    regular_user.save()

    response = api_client.post("/api/token/refresh/", {"refresh": tokens["refresh"]}, format="json")

    assert response.status_code == 401


def test_token_lifetimes_follow_settings(api_client, regular_user):
    tokens = _obtain(api_client, "regular")
    access, refresh = _claims(tokens["access"]), _claims(tokens["refresh"])

    assert access["exp"] - access["iat"] == settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"].total_seconds()
    assert refresh["exp"] - refresh["iat"] == settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds()


# ----------------------------------------------------------
#  POST /api/token/blacklist/ (odjava)
# ----------------------------------------------------------

def test_logout_blacklists_refresh_token(api_client, regular_user):
    tokens = _obtain(api_client, "regular")

    response = api_client.post("/api/token/blacklist/", {"refresh": tokens["refresh"]}, format="json")

    assert response.status_code == 200
    refresh = api_client.post("/api/token/refresh/", {"refresh": tokens["refresh"]}, format="json")
    assert refresh.status_code == 401


def test_logout_with_invalid_token_returns_401(api_client):
    response = api_client.post("/api/token/blacklist/", {"refresh": "nije-token"}, format="json")

    assert response.status_code == 401


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


def test_registration_ignores_client_supplied_is_active(api_client):
    response = api_client.post("/api/users/", _registration_payload(is_active=False), format="json")

    assert response.status_code == 201
    assert User.objects.get(username="novi").is_active is True


def test_registration_ignores_client_supplied_date_joined(api_client):
    api_client.post("/api/users/", _registration_payload(date_joined="2000-01-01"), format="json")

    assert User.objects.get(username="novi").date_joined.year != 2000


@pytest.mark.parametrize(
    "password, message",
    [
        ("1", "Ova lozinka je prekratka. Mora da sadrži najmanje 8 znakova."),
        ("password123", "Ova lozinka je među najčešće korišćenim lozinkama."),
        ("1234567890", "Ova lozinka sadrži samo cifre."),
        ("novi-korisnik", "Lozinka je previše slična korisničko ime."),
    ],
    ids=["kratka", "cesta", "samo-cifre", "slicna-korisnickom-imenu"],
)
def test_registration_rejects_weak_password(api_client, password, message):
    payload = _registration_payload(username="novi_korisnik", password=password)

    response = api_client.post("/api/users/", payload, format="json")

    assert response.status_code == 400
    #* Poruke validatora su na srpskom, FE ih prikazuje ispod polja za lozinku
    assert message in response.json()["password"]
    assert not User.objects.filter(username="novi_korisnik").exists()


@pytest.mark.parametrize("email", ["", "nije-email", None], ids=["prazan", "nevalidan", "bez-polja"])
def test_registration_requires_valid_email(api_client, email):
    payload = _registration_payload(email=email)
    if email is None:
        del payload["email"]

    response = api_client.post("/api/users/", payload, format="json")

    assert response.status_code == 400
    assert "email" in response.json()
    assert not User.objects.filter(username="novi").exists()


def test_registration_with_existing_email_returns_400(api_client, regular_user):
    #* Email je jedinstven bez obzira na velika i mala slova
    response = api_client.post("/api/users/", _registration_payload(email="Regular@Example.com"), format="json")

    assert response.status_code == 400
    assert response.json() == {"email": ["Korisnik sa ovom email adresom već postoji."]}
    assert not User.objects.filter(username="novi").exists()


# ----------------------------------------------------------
#  Enumeracija korisničkih imena
# ----------------------------------------------------------

def test_anonymous_cannot_enumerate_usernames(api_client, regular_user):
    #* Endpoint za proveru postojanja korisničkog imena (GET /api/users/<username>/) je uklonjen
    existing = api_client.get("/api/users/regular/")
    missing = api_client.get("/api/users/ne_postoji/")

    assert existing.status_code == missing.status_code == 404


def test_login_error_does_not_reveal_whether_username_exists(api_client, regular_user):
    wrong_password = api_client.post("/api/token/", {"username": "regular", "password": "pogresna"}, format="json")
    unknown_user = api_client.post("/api/token/", {"username": "ne_postoji", "password": "pogresna"}, format="json")

    assert wrong_password.status_code == unknown_user.status_code == 401
    assert wrong_password.json() == unknown_user.json()


# ----------------------------------------------------------
#  Throttling (brute-force zaštita)
# ----------------------------------------------------------

@pytest.fixture
def low_throttle_rates(monkeypatch):
    for scope in ("login", "token_refresh", "register", "password"):
        monkeypatch.setitem(ScopedRateThrottle.THROTTLE_RATES, scope, "2/min")


def test_login_is_throttled(api_client, regular_user, low_throttle_rates):
    payload = {"username": "regular", "password": "pogresna"}
    statuses = [api_client.post("/api/token/", payload, format="json").status_code for _ in range(3)]

    assert statuses == [401, 401, 429]
    #* Ni ispravna lozinka ne prolazi dok traje ograničenje
    correct = api_client.post("/api/token/", {"username": "regular", "password": DEFAULT_PASSWORD}, format="json")
    assert correct.status_code == 429


def test_token_refresh_is_throttled(api_client, low_throttle_rates):
    statuses = [
        api_client.post("/api/token/refresh/", {"refresh": "nije-token"}, format="json").status_code for _ in range(3)
    ]

    assert statuses == [401, 401, 429]


def test_registration_is_throttled(api_client, low_throttle_rates):
    statuses = [
        api_client.post(
            "/api/users/", _registration_payload(username=f"novi{i}", email=f"novi{i}@example.com"), format="json"
        ).status_code
        for i in range(3)
    ]

    assert statuses == [201, 201, 429]
    assert not User.objects.filter(username="novi2").exists()


def test_other_endpoints_are_not_throttled(regular_client, low_throttle_rates):
    statuses = {regular_client.get("/api/company/types/").status_code for _ in range(5)}

    assert statuses == {200}
