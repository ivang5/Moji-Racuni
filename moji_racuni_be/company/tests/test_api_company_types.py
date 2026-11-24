"""
Karakterizacioni testovi: lični tipovi preduzeća (/api/company/types/...).
"""
import pytest

from company.models import CompanyType
from company.tests.factories import CompanyTypeFactory
from receipt.tests.datasets import PERIOD

pytestmark = pytest.mark.django_db

TYPE_FIELDS = {"id", "name", "description", "user"}


@pytest.fixture
def alice_client(auth_client, stats_data):
    return auth_client(stats_data.alice)


# ----------------------------------------------------------
#  GET/POST /api/company/types/
# ----------------------------------------------------------

def test_types_list_returns_only_own_types(alice_client, stats_data):
    response = alice_client.get("/api/company/types/")

    assert response.status_code == 200
    assert response.json() == [
        {"id": stats_data.alice_market.id, "name": "Market", "description": "Supermarketi", "user": stats_data.alice.id},
        {"id": stats_data.alice_apoteka.id, "name": "Apoteka", "description": "Apoteke", "user": stats_data.alice.id},
    ]


def test_create_type(regular_client, regular_user):
    #* Isti oblik kao Companies.tsx (FE šalje i user)
    response = regular_client.post(
        "/api/company/types/", {"name": "Restoran", "description": "Hrana", "user": regular_user.id}, format="json"
    )

    assert response.status_code == 201
    assert set(response.json()) == TYPE_FIELDS
    assert CompanyType.objects.get(id=response.json()["id"]).user == regular_user


def test_create_type_with_existing_own_name_returns_409(alice_client, stats_data):
    response = alice_client.post(
        "/api/company/types/", {"name": "Market", "description": "Duplikat", "user": stats_data.alice.id}, format="json"
    )

    assert response.status_code == 409


def test_create_type_with_name_used_by_other_user_is_allowed(alice_client, stats_data):
    response = alice_client.post(
        "/api/company/types/", {"name": "Prodavnica", "description": "Moja", "user": stats_data.alice.id}, format="json"
    )

    assert response.status_code == 201


def test_create_type_without_description_returns_400(regular_client, regular_user):
    response = regular_client.post("/api/company/types/", {"name": "Restoran", "user": regular_user.id}, format="json")

    assert response.status_code == 400
    assert "description" in response.json()


@pytest.mark.xfail(strict=True, reason="Bezbednosni propust: korisnik kreira tip preduzeća za drugog korisnika (polje user)")
def test_create_type_always_belongs_to_current_user(regular_client, regular_user, other_regular_user):
    response = regular_client.post(
        "/api/company/types/", {"name": "Podmetnut", "description": "x", "user": other_regular_user.id}, format="json"
    )

    assert response.status_code in (201, 400)
    assert not CompanyType.objects.filter(user=other_regular_user).exists()


# ----------------------------------------------------------
#  GET/PUT/DELETE /api/company/types/<id>/
# ----------------------------------------------------------

def test_retrieve_own_type(alice_client, stats_data):
    response = alice_client.get(f"/api/company/types/{stats_data.alice_market.id}/")

    assert response.status_code == 200
    assert response.json()["name"] == "Market"


def test_retrieve_type_of_other_user_returns_404(alice_client, stats_data):
    assert alice_client.get(f"/api/company/types/{stats_data.bob_prodavnica.id}/").status_code == 404


def test_update_own_type(alice_client, stats_data):
    t = stats_data.alice_market

    response = alice_client.put(
        f"/api/company/types/{t.id}/", {"name": "Supermarket", "description": "Novo", "user": stats_data.alice.id}, format="json"
    )

    assert response.status_code == 200
    t.refresh_from_db()
    assert (t.name, t.description) == ("Supermarket", "Novo")


def test_update_own_type_with_invalid_data_returns_400(alice_client, stats_data):
    response = alice_client.put(f"/api/company/types/{stats_data.alice_market.id}/", {"name": "Bez opisa"}, format="json")

    assert response.status_code == 400


def test_update_type_of_other_user_returns_404(alice_client, stats_data):
    t = stats_data.bob_prodavnica

    response = alice_client.put(
        f"/api/company/types/{t.id}/", {"name": "Preuzet", "description": "x", "user": stats_data.alice.id}, format="json"
    )

    assert response.status_code == 404
    t.refresh_from_db()
    assert t.name == "Prodavnica"


@pytest.mark.xfail(strict=True, reason="Bezbednosni propust: korisnik može da \"prebaci\" svoj tip drugom korisniku (polje user)")
def test_update_type_cannot_change_owner(alice_client, stats_data):
    t = stats_data.alice_market

    alice_client.put(
        f"/api/company/types/{t.id}/", {"name": "Market", "description": "x", "user": stats_data.bob.id}, format="json"
    )

    t.refresh_from_db()
    assert t.user == stats_data.alice


def test_delete_own_type(alice_client, stats_data):
    t = stats_data.alice_market

    assert alice_client.delete(f"/api/company/types/{t.id}/").status_code == 204
    assert not CompanyType.objects.filter(id=t.id).exists()
    #* Veza sa preduzećem se briše, tip drugog korisnika ostaje
    assert list(stats_data.c1.type.all()) == [stats_data.bob_prodavnica]


def test_delete_type_of_other_user_returns_404(alice_client, stats_data):
    assert alice_client.delete(f"/api/company/types/{stats_data.bob_prodavnica.id}/").status_code == 404
    assert CompanyType.objects.filter(id=stats_data.bob_prodavnica.id).exists()


def test_delete_unknown_type_returns_404(regular_client):
    assert regular_client.delete("/api/company/types/999999/").status_code == 404


# ----------------------------------------------------------
#  GET /api/company/types/company/?tin=
# ----------------------------------------------------------

def test_type_of_company_for_current_user(auth_client, stats_data):
    d = stats_data

    assert auth_client(d.alice).get("/api/company/types/company/", {"tin": d.c1.tin}).json()["name"] == "Market"
    assert auth_client(d.bob).get("/api/company/types/company/", {"tin": d.c1.tin}).json()["name"] == "Prodavnica"


def test_type_of_company_without_own_type_returns_empty_body(auth_client, stats_data):
    response = auth_client(stats_data.alice).get("/api/company/types/company/", {"tin": stats_data.c3.tin})

    #* Response(None): 200 sa praznim telom i bez Content-Type (nije JSON null)
    assert response.status_code == 200
    assert response.content == b""


def test_type_of_company_bad_params(alice_client):
    assert alice_client.get("/api/company/types/company/").status_code == 400
    assert alice_client.get("/api/company/types/company/", {"tin": 999999999}).status_code == 404


# ----------------------------------------------------------
#  Statistika po tipovima (golden, skup iz receipt/tests/datasets.py)
# ----------------------------------------------------------

def test_most_spent_and_most_visited_types_regular(alice_client, auth_client, stats_data):
    expected = [
        {"companyType": "Market", "receiptCount": 3, "priceSum": 4120.0},
        {"companyType": "Apoteka", "receiptCount": 1, "priceSum": 250.5},
    ]
    bob = auth_client(stats_data.bob)

    assert alice_client.get("/api/company/types/most-spent/", {**PERIOD, "limit": 10}).json() == expected
    assert alice_client.get("/api/company/types/most-visited/", {**PERIOD, "limit": 10}).json() == expected
    assert alice_client.get("/api/company/types/most-spent/", {**PERIOD, "limit": 1}).json() == expected[:1]
    assert bob.get("/api/company/types/most-spent/", {**PERIOD, "limit": 10}).json() == [
        {"companyType": "Prodavnica", "receiptCount": 2, "priceSum": 1500.0}
    ]


def test_most_spent_and_most_visited_types_admin_is_empty(admin_api_client, stats_data):
    #* Tipovi su lični, a ADMIN upit filtrira po tipovima samog admina (šta ADMIN treba da vidi još nije odlučeno)
    assert admin_api_client.get("/api/company/types/most-spent/", {**PERIOD, "limit": 10}).json() == []
    assert admin_api_client.get("/api/company/types/most-visited/", {**PERIOD, "limit": 10}).json() == []


@pytest.mark.parametrize("path", ["/api/company/types/most-spent/", "/api/company/types/most-visited/"])
def test_most_spent_visited_types_bad_params_return_400(regular_client, path):
    assert regular_client.get(path, {"dateTo": "2025-12-31", "limit": 5}).status_code == 400
    assert regular_client.get(path, {**PERIOD, "limit": "x"}).status_code == 400
