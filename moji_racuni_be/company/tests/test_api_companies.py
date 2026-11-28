"""
Testovi: preduzeća i prodajna mesta (/api/companies/..., /api/company/units/...).
Kreiranje preko linka računa je u receipt/tests/test_api_receipt_import.py.

Prijavljen korisnik bez prava na akciju dobija 403, a 401 samo neprijavljen korisnik.
"""
import io
import os
import re

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
#  GET /api/companies/<tin>/
# ----------------------------------------------------------

def test_companies_list_is_removed(regular_client):
    #* Lista svih preduzeća nije korišćena na FE (FE koristi /api/companies/filter/)
    CompanyFactory(tin=100000001, name="Alfa Market")

    assert regular_client.get("/api/companies/").status_code == 405


def test_companies_require_authentication(api_client, stats_data):
    assert api_client.get(f"/api/companies/{stats_data.c1.tin}/").status_code == 401


def test_company_retrieve(regular_client, stats_data):
    response = regular_client.get(f"/api/companies/{stats_data.c1.tin}/")

    assert response.status_code == 200
    #* Bez polja type: veza sa tipovima sadrži tipove svih korisnika (alice "Market", bob "Prodavnica")
    assert response.json() == {"tin": 100000001, "name": "Alfa Market", "image": None}


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
    assert response.json() == {"tin": d.c1.tin, "name": d.c1.name, "image": None}
    #* alice "Market" zamenjen sa "Apoteka", bob "Prodavnica" ostaje
    assert sorted(t.id for t in d.c1.type.all()) == sorted([d.alice_apoteka.id, d.bob_prodavnica.id])


def test_change_type_none_removes_own_type(alice_client, stats_data):
    d = stats_data

    response = alice_client.put(f"/api/companies/{d.c1.tin}/change-type/", {"type": "none"}, format="json")

    assert response.status_code == 200
    assert list(d.c1.type.all()) == [d.bob_prodavnica]


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

def _image_upload(name="logo.png", fmt="PNG", size=(4, 4), content_type="image/png"):
    buffer = io.BytesIO()
    Image.new("RGB", size, "green").save(buffer, format=fmt)
    return SimpleUploadedFile(name, buffer.getvalue(), content_type=content_type)


@pytest.fixture
def media_root(settings, tmp_path):
    settings.MEDIA_ROOT = str(tmp_path)
    return tmp_path


def _change_img(client, company, upload):
    return client.put(f"/api/companies/{company.tin}/change-img/", {"img": upload}, format="multipart")


@pytest.mark.parametrize(
    "fmt, content_type, extension",
    [("PNG", "image/png", "png"), ("JPEG", "image/jpeg", "jpg"), ("WEBP", "image/webp", "webp")],
)
def test_admin_changes_company_image(admin_api_client, media_root, fmt, content_type, extension):
    company = CompanyFactory(tin=100000001)

    response = _change_img(admin_api_client, company, _image_upload("../../logo firme.png", fmt, content_type=content_type))

    assert response.status_code == 200
    company.refresh_from_db()
    #* Ime fajla je nasumično (uuid), ekstenzija prema stvarnom formatu slike
    assert re.fullmatch(rf"images/[0-9a-f]{{32}}\.{extension}", company.image.name)
    assert response.json()["image"] == f"/media/{company.image.name}"
    assert (media_root / company.image.name).exists()


def test_changing_company_image_deletes_old_file(admin_api_client, media_root):
    company = CompanyFactory(tin=100000001)
    _change_img(admin_api_client, company, _image_upload())
    company.refresh_from_db()
    old_name = company.image.name

    response = _change_img(admin_api_client, company, _image_upload())

    assert response.status_code == 200
    company.refresh_from_db()
    assert company.image.name != old_name
    assert not (media_root / old_name).exists()
    assert sorted(p.name for p in (media_root / "images").iterdir()) == [company.image.name.split("/")[1]]


@pytest.mark.parametrize(
    "upload",
    [
        pytest.param(SimpleUploadedFile("logo.png", b"nije slika", content_type="image/png"), id="nije-slika"),
        pytest.param(
            SimpleUploadedFile("logo.svg", b'<svg xmlns="http://www.w3.org/2000/svg"></svg>', content_type="image/svg+xml"),
            id="svg",
        ),
        pytest.param(_image_upload("logo.gif", "GIF", content_type="image/gif"), id="gif"),
        pytest.param(_image_upload("logo.png", size=(4097, 1)), id="prevelike-dimenzije"),
        pytest.param(None, id="bez-fajla"),
    ],
)
def test_change_company_image_rejects_invalid_upload(admin_api_client, media_root, upload):
    company = CompanyFactory(tin=100000001)
    data = {"img": upload} if upload is not None else {}

    response = admin_api_client.put(f"/api/companies/{company.tin}/change-img/", data, format="multipart")

    assert response.status_code == 400
    assert "img" in response.json()
    company.refresh_from_db()
    assert not company.image
    assert not (media_root / "images").exists()


def test_change_company_image_rejects_too_large_file(admin_api_client, media_root):
    company = CompanyFactory(tin=100000001)
    #* Šum se ne kompresuje: PNG 1000x1000 RGB je ~3 MB (granica je 2 MB)
    buffer = io.BytesIO()
    Image.frombytes("RGB", (1000, 1000), os.urandom(3 * 1000 * 1000)).save(buffer, format="PNG")
    upload = SimpleUploadedFile("logo.png", buffer.getvalue(), content_type="image/png")

    response = _change_img(admin_api_client, company, upload)

    assert response.status_code == 400
    assert response.json() == {"img": ["Slika može imati najviše 2 MB."]}
    company.refresh_from_db()
    assert not company.image


def test_regular_cannot_change_company_image(regular_client, media_root):
    company = CompanyFactory(tin=100000001)

    response = _change_img(regular_client, company, _image_upload())

    assert response.status_code == 403
    company.refresh_from_db()
    assert not company.image


# ----------------------------------------------------------
#  DELETE /api/companies/<tin>/ (uklonjeno, FE ga ne koristi)
# ----------------------------------------------------------

@pytest.mark.parametrize("client_fixture", ["admin_api_client", "regular_client"])
def test_company_delete_is_removed(request, client_fixture):
    client = request.getfixturevalue(client_fixture)
    company = CompanyFactory()

    assert client.delete(f"/api/companies/{company.tin}/").status_code == 405
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


@pytest.mark.parametrize("client_fixture", ["admin_api_client", "regular_client"])
def test_company_unit_delete_is_removed(request, client_fixture):
    #* Brisanje prodajnog mesta nije korišćeno na FE
    client = request.getfixturevalue(client_fixture)
    unit = CompanyUnitFactory()

    assert client.delete(f"/api/company/units/{unit.id}/").status_code == 405
    assert CompanyUnit.objects.filter(id=unit.id).exists()
