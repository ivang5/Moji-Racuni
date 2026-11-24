"""
Karakterizacioni testovi: unos računa preko linka, end-to-end kroz API, kao na početnoj strani FE
(POST companies -> company/units -> receipts -> items). PURS se mock-uje sintetičkim računom iz
test_parser.py (bez mreže).
"""
from types import SimpleNamespace

import pytest

from company.models import Company, CompanyUnit
from company.tests.factories import CompanyFactory
from moji_racuni_be import utils
from receipt.models import Item, Receipt
from receipt.tests.factories import ReceiptFactory, utc
from receipt.tests.test_parser import SYNTHETIC_EXPECTED, build_synthetic_html

pytestmark = pytest.mark.django_db

URL = "https://suf.purs.gov.rs/v/?vl=SINTETICKI-RACUN"
TIN = 999999999


@pytest.fixture
def purs(monkeypatch):
    """Mock requests.get: vraća sintetički račun; purs.calls beleži pozvane URL-ove."""
    state = SimpleNamespace(calls=[], response=SimpleNamespace(status_code=200, text=build_synthetic_html("\r\n")))

    def get(url, **kwargs):
        state.calls.append(url)
        return state.response

    monkeypatch.setattr(utils.requests, "get", get)
    return state


def _import(client, url=URL):
    """Ista 4 koraka kao FE (companyService.ts, receiptService.ts); vraća odgovore."""
    company = client.post("/api/companies/", {"url": url}, format="json")
    unit = client.post("/api/company/units/", {"url": url, "company": TIN}, format="json")
    receipt = client.post("/api/receipts/", {"url": url, "companyUnit": unit.json()["id"]}, format="json")
    responses = SimpleNamespace(company=company, unit=unit, receipt=receipt, items=None)
    if receipt.status_code == 201:
        responses.items = client.post("/api/items/", {"url": url, "receipt": receipt.json()["id"]}, format="json")
    return responses


def test_import_receipt_end_to_end(regular_client, regular_user, purs):
    r = _import(regular_client)

    assert r.company.status_code == 201
    assert r.company.json() == {"tin": TIN, "name": "Test Prodavnica", "image": None, "type": []}

    assert r.unit.status_code == 201
    unit_id = r.unit.json()["id"]
    assert r.unit.json() == {"id": unit_id, **SYNTHETIC_EXPECTED["company_unit"]}

    assert r.receipt.status_code == 201
    receipt_id = r.receipt.json()["id"]
    assert r.receipt.json() == {
        "id": receipt_id,
        "date": "2025-02-05T09:07:30Z",
        "link": URL,
        "totalPrice": "1395.00",
        "totalVat": "53.64",
        "user": regular_user.id,
        "companyUnit": unit_id,
    }

    assert r.items.status_code == 201
    #* Odgovor je izlaz parsera (vatType kao string, iznosi kao float), ne serializer
    assert r.items.json() == [{**item, "receipt": receipt_id} for item in SYNTHETIC_EXPECTED["items"]]

    assert purs.calls == [URL] * 4
    receipt = Receipt.objects.get(id=receipt_id)
    assert receipt.date == utc(2025, 2, 5, 9, 7, 30)
    assert receipt.companyUnit.company.tin == TIN
    items = list(receipt.item_set.order_by("id").values_list("name", "measurementUnit", "vatType", "price", "quantity"))
    assert [(name, unit, vat, str(price), str(qty)) for name, unit, vat, price, qty in items] == [
        ("test jabuke", "KG", 10, "100.00", "1.500"),
        ("test sok 1l", "KOM", 20, "120.00", "2.000"),
        ("test kesa", "KOM", 0, "5.00", "1.000"),
        ("test televizor", "KOM", 0, "1000.00", "1.000"),
    ]


def test_reimport_of_same_receipt_returns_409_without_duplicates(regular_client, purs):
    first = _import(regular_client)

    second = _import(regular_client)

    #* Preduzeće i prodajno mesto se ponovo preuzimaju i ažuriraju (201), tek račun vraća 409
    assert (second.company.status_code, second.unit.status_code, second.receipt.status_code) == (201, 201, 409)
    assert second.unit.json()["id"] == first.unit.json()["id"]
    assert second.items is None
    assert (Company.objects.count(), CompanyUnit.objects.count(), Receipt.objects.count()) == (1, 1, 1)
    assert Item.objects.count() == 4


def test_same_receipt_can_be_imported_by_two_users(regular_client, other_client, purs):
    _import(regular_client)

    other = _import(other_client)

    assert other.receipt.status_code == 201
    assert Receipt.objects.filter(link=URL).count() == 2
    assert CompanyUnit.objects.count() == 1


def test_import_updates_existing_company_name(regular_client, purs):
    CompanyFactory(tin=TIN, name="Stari naziv")

    response = regular_client.post("/api/companies/", {"url": URL}, format="json")

    assert response.status_code == 201
    assert Company.objects.get(tin=TIN).name == "Test Prodavnica"


def test_admin_cannot_import_receipt_or_items(admin_api_client, purs):
    receipt = ReceiptFactory()

    assert admin_api_client.post("/api/receipts/", {"url": URL, "companyUnit": receipt.companyUnit_id}, format="json").status_code == 401
    assert admin_api_client.post("/api/items/", {"url": URL, "receipt": receipt.id}, format="json").status_code == 401
    assert purs.calls == []


@pytest.mark.parametrize(
    "response, expected_status",
    [
        pytest.param(SimpleNamespace(status_code=200, text="<html>nije račun</html>"), 400, id="nepoznata-stranica"),
        pytest.param(SimpleNamespace(status_code=302, text=""), 400, id="redirect"),
        pytest.param(SimpleNamespace(status_code=503, text=""), 502, id="purs-nedostupan"),
    ],
)
def test_receipt_import_errors_return_4xx_or_502(regular_client, purs, response, expected_status):
    unit = _import(regular_client).unit.json()
    purs.response = response

    result = regular_client.post("/api/receipts/", {"url": URL + "-2", "companyUnit": unit["id"]}, format="json")

    assert result.status_code == expected_status
    assert set(result.json()) == {"detail"}
    assert Receipt.objects.count() == 1
