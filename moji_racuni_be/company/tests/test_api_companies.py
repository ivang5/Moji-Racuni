"""
Karakterizacioni testovi: preduzeća i prodajna mesta (/api/companies/..., /api/company/units/...).
Kreiranje preko linka računa je u receipt/tests/test_api_receipt_import.py.
"""
import io

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image

from company.models import Company, CompanyUnit
from company.tests.factories import CompanyFactory, CompanyUnitFactory
from receipt.tests.datasets import PERIOD

pytestmark = pytest.mark.django_db

COMPANY_FILTER_ALL = {"name": "%", "tin": "%", "type": "%", "orderBy": "name", "ascendingOrder": "asc"}


def _tins(rows):
    return [row["tin"] for row in rows]


@pytest.fixture
def alice_client(auth_client, stats_data):
    return auth_client(stats_data.alice)


# ----------------------------------------------------------
#  GET /api/companies/, /api/companies/<tin>/
# ----------------------------------------------------------

def test_companies_list_returns_all_companies(regular_client):
    company = CompanyFactory(tin=100000001, name="Alfa Market")

    response = regular_client.get("/api/companies/")

    assert response.status_code == 200
    assert response.json() == [{"tin": company.tin, "name": "Alfa Market", "image": None, "type": []}]


def test_companies_require_authentication(api_client):
    assert api_client.get("/api/companies/").status_code == 401


def test_company_retrieve(regular_client, stats_data):
    response = regular_client.get(f"/api/companies/{stats_data.c1.tin}/")

    assert response.status_code == 200
    body = response.json()
    assert (body["tin"], body["name"], body["image"]) == (100000001, "Alfa Market", None)
    #* type sadrži tipove SVIH korisnika (ovde alice "Market" i bob "Prodavnica")
    assert sorted(body["type"]) == sorted([stats_data.alice_market.id, stats_data.bob_prodavnica.id])


def test_company_retrieve_unknown_returns_404(regular_client):
    assert regular_client.get("/api/companies/999999999/").status_code == 404


# ----------------------------------------------------------
#  GET /api/companies/filter/
# ----------------------------------------------------------

def test_companies_filter_regular_sees_only_visited_companies(alice_client, stats_data):
    response = alice_client.get("/api/companies/filter/", COMPANY_FILTER_ALL)

    assert response.status_code == 200
    body = response.json()
    assert (body["pageCount"], body["pageNum"]) == (1, 1)
    #* Gama Pekara (samo bob) se ne vidi; raw SQL red: preduzeće bez slike ima image "" (serializer vraća null)
    assert body["companies"] == [
        {"tin": 100000001, "name": "Alfa Market", "image": ""},
        {"tin": 100000002, "name": "Beta Apoteka", "image": ""},
    ]


def test_companies_filter_admin_sees_all_companies(admin_api_client, stats_data):
    CompanyFactory(tin=100000009, name="Bez računa")

    rows = admin_api_client.get("/api/companies/filter/", {**COMPANY_FILTER_ALL, "ascendingOrder": "desc"}).json()["companies"]

    #* Gama Pekara > Bez računa > Beta Apoteka > Alfa Market
    assert _tins(rows) == [100000003, 100000009, 100000002, 100000001]


@pytest.mark.parametrize(
    "params, expected",
    [
        pytest.param({"name": "BETA"}, [100000002], id="naziv-case-insensitive"),
        pytest.param({"tin": "0002"}, [100000002], id="deo-pib-a"),
        pytest.param({"type": "market"}, [100000001], id="sopstveni-tip"),
        pytest.param({"orderBy": "tin", "ascendingOrder": "desc"}, [100000002, 100000001], id="sort-pib-desc"),
    ],
)
def test_companies_filter_params(alice_client, stats_data, params, expected):
    rows = alice_client.get("/api/companies/filter/", {**COMPANY_FILTER_ALL, **params}).json()["companies"]

    assert _tins(rows) == expected


def test_companies_filter_pagination(admin_api_client):
    for i in range(13):
        CompanyFactory(tin=100000100 + i, name=f"Preduzeće {i:02d}")

    page1 = admin_api_client.get("/api/companies/filter/", COMPANY_FILTER_ALL).json()
    page2 = admin_api_client.get("/api/companies/filter/", {**COMPANY_FILTER_ALL, "page": 2}).json()

    assert (page1["pageCount"], len(page1["companies"])) == (2, 12)
    assert _tins(page2["companies"]) == [100000112]


def test_companies_filter_without_required_params_returns_400(regular_client):
    assert regular_client.get("/api/companies/filter/", {"name": "%"}).status_code == 400


# ----------------------------------------------------------
#  Statistika preduzeća (golden, skup iz receipt/tests/datasets.py)
# ----------------------------------------------------------

def _company_row(receipt_count, price_sum, unit_count, tin, name):
    return {"receiptCount": receipt_count, "priceSum": price_sum, "unitCount": unit_count, "companyTin": tin, "companyName": name}


ALFA_ALICE = _company_row(3, 4120.0, 2, 100000001, "Alfa Market")
BETA_ALICE = _company_row(1, 250.5, 1, 100000002, "Beta Apoteka")


def test_visited_companies(alice_client, admin_api_client):
    assert alice_client.get("/api/companies/visited/", PERIOD).json() == {"companyCount": 2, "unitCount": 3}
    #* ADMIN: bez deduplikacije, ali B1 je u istom prodajnom mestu kao A1 pa ne menja brojeve
    assert admin_api_client.get("/api/companies/visited/", PERIOD).json() == {"companyCount": 3, "unitCount": 4}


def test_most_spent_and_most_visited_companies_regular(alice_client):
    assert alice_client.get("/api/companies/most-spent/", {**PERIOD, "limit": 5}).json() == [ALFA_ALICE, BETA_ALICE]
    assert alice_client.get("/api/companies/most-spent/", {**PERIOD, "limit": 1}).json() == [ALFA_ALICE]
    assert alice_client.get("/api/companies/most-visited/", {**PERIOD, "limit": 5}).json() == [ALFA_ALICE, BETA_ALICE]


def test_most_spent_and_most_visited_companies_other_regular(auth_client, stats_data):
    client = auth_client(stats_data.bob)
    alfa = _company_row(1, 1000.0, 1, 100000001, "Alfa Market")
    gama = _company_row(1, 500.0, 1, 100000003, "Gama Pekara")

    assert client.get("/api/companies/most-spent/", {**PERIOD, "limit": 5}).json() == [alfa, gama]
    #* Isti broj poseta -> sekundarno po iznosu
    assert client.get("/api/companies/most-visited/", {**PERIOD, "limit": 5}).json() == [alfa, gama]


def test_most_spent_and_most_visited_companies_admin(admin_api_client, stats_data):
    gama = _company_row(1, 500.0, 1, 100000003, "Gama Pekara")
    expected = [ALFA_ALICE, gama, BETA_ALICE]

    assert admin_api_client.get("/api/companies/most-spent/", {**PERIOD, "limit": 5}).json() == expected
    assert admin_api_client.get("/api/companies/most-visited/", {**PERIOD, "limit": 5}).json() == expected


@pytest.mark.parametrize("path", ["/api/companies/most-spent/", "/api/companies/most-visited/"])
def test_most_spent_visited_companies_bad_params_return_400(regular_client, path):
    assert regular_client.get(path, {"dateFrom": "2025-01-01", "limit": 5}).status_code == 400
    assert regular_client.get(path, {**PERIOD, "limit": "x"}).status_code == 400


def test_company_visits(alice_client, admin_api_client, stats_data):
    tin = stats_data.c1.tin
    #* Bez filtera po periodu (uključuje A_OUT iz 2024) i bez ADMIN deduplikacije
    assert alice_client.get(f"/api/companies/{tin}/visits/").json() == {"visits": 4, "spent": 5119.99}
    assert admin_api_client.get(f"/api/companies/{tin}/visits/").json() == {"visits": 5, "spent": 6119.99}
    assert alice_client.get(f"/api/companies/{stats_data.c3.tin}/visits/").json() == {"visits": 0, "spent": None}


# ----------------------------------------------------------
#  PUT /api/companies/<tin>/change-type/
# ----------------------------------------------------------

def test_change_type_replaces_only_own_type(alice_client, stats_data):
    d = stats_data

    response = alice_client.put(f"/api/companies/{d.c1.tin}/change-type/", {"type": d.alice_apoteka.id}, format="json")

    assert response.status_code == 200
    #* alice "Market" zamenjen sa "Apoteka", bob "Prodavnica" ostaje
    assert sorted(response.json()["type"]) == sorted([d.alice_apoteka.id, d.bob_prodavnica.id])


def test_change_type_none_removes_own_type(alice_client, stats_data):
    d = stats_data

    response = alice_client.put(f"/api/companies/{d.c1.tin}/change-type/", {"type": "none"}, format="json")

    assert response.status_code == 200
    assert response.json()["type"] == [d.bob_prodavnica.id]


def test_change_type_to_type_of_other_user_returns_404(alice_client, stats_data):
    d = stats_data

    response = alice_client.put(f"/api/companies/{d.c2.tin}/change-type/", {"type": d.bob_prodavnica.id}, format="json")

    assert response.status_code == 404
    assert list(d.c2.type.all()) == [d.alice_apoteka]


def test_change_type_of_unknown_company_returns_404(alice_client, stats_data):
    response = alice_client.put("/api/companies/999999999/change-type/", {"type": "none"}, format="json")

    assert response.status_code == 404


# ----------------------------------------------------------
#  PUT /api/companies/<tin>/change-img/ (ADMIN)
# ----------------------------------------------------------

def _png_upload(name="logo.png"):
    buffer = io.BytesIO()
    Image.new("RGB", (4, 4), "green").save(buffer, format="PNG")
    return SimpleUploadedFile(name, buffer.getvalue(), content_type="image/png")


def test_admin_changes_company_image(admin_api_client, settings, tmp_path):
    settings.MEDIA_ROOT = str(tmp_path)
    company = CompanyFactory(tin=100000001)

    response = admin_api_client.put(f"/api/companies/{company.tin}/change-img/", {"img": _png_upload()}, format="multipart")

    assert response.status_code == 200
    assert response.json()["image"] == "/media/images/logo.png"
    company.refresh_from_db()
    assert company.image.name == "images/logo.png"
    assert (tmp_path / "images" / "logo.png").exists()


def test_regular_cannot_change_company_image(regular_client, settings, tmp_path):
    settings.MEDIA_ROOT = str(tmp_path)
    company = CompanyFactory(tin=100000001)

    response = regular_client.put(f"/api/companies/{company.tin}/change-img/", {"img": _png_upload()}, format="multipart")

    assert response.status_code == 401
    company.refresh_from_db()
    assert not company.image


# ----------------------------------------------------------
#  DELETE /api/companies/<tin>/ (ADMIN)
# ----------------------------------------------------------

def test_admin_deletes_company_and_units_keep_null_company(admin_api_client):
    unit = CompanyUnitFactory()

    response = admin_api_client.delete(f"/api/companies/{unit.company_id}/")

    assert response.status_code == 204
    assert not Company.objects.filter(tin=unit.company_id).exists()
    unit.refresh_from_db()
    assert unit.company is None


def test_regular_cannot_delete_company(regular_client):
    company = CompanyFactory()

    assert regular_client.delete(f"/api/companies/{company.tin}/").status_code == 401
    assert Company.objects.filter(tin=company.tin).exists()


# ----------------------------------------------------------
#  /api/company/units/
# ----------------------------------------------------------

def test_company_units_by_tin(regular_client, stats_data):
    d = stats_data

    response = regular_client.get("/api/company/units/", {"tin": d.c1.tin})

    assert response.status_code == 200
    assert [u["id"] for u in response.json()] == [d.u1.id, d.u2.id]
    assert response.json()[0] == {
        "id": d.u1.id,
        "name": "Alfa Market 1",
        "address": "Bulevar Oslobođenja 1",
        "place": "Novi Sad",
        "municipality": "Novi Sad",
        "category": "Promet\nProdaja",
        "company": d.c1.tin,
    }


def test_company_units_without_tin_returns_400(regular_client):
    assert regular_client.get("/api/company/units/").status_code == 400


def test_company_unit_retrieve(regular_client, stats_data):
    response = regular_client.get(f"/api/company/units/{stats_data.u3.id}/")

    assert response.status_code == 200
    assert response.json()["name"] == "Beta Apoteka Centar"


def test_company_unit_retrieve_unknown_returns_404(regular_client):
    assert regular_client.get("/api/company/units/999999/").status_code == 404


def test_admin_deletes_company_unit(admin_api_client):
    unit = CompanyUnitFactory()

    assert admin_api_client.delete(f"/api/company/units/{unit.id}/").status_code == 204
    assert not CompanyUnit.objects.filter(id=unit.id).exists()


def test_regular_cannot_delete_company_unit(regular_client):
    unit = CompanyUnitFactory()

    assert regular_client.delete(f"/api/company/units/{unit.id}/").status_code == 401
    assert CompanyUnit.objects.filter(id=unit.id).exists()
