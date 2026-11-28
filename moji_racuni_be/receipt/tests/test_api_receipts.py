"""
Testovi: računi (filter, detalji, poslednji račun, brisanje).
Unos računa preko linka je u test_api_receipt_import.py.
"""
import pytest

from receipt.models import Item, Receipt
from receipt.tests.datasets import PERIOD
from receipt.tests.factories import ItemFactory, ReceiptFactory, utc

pytestmark = pytest.mark.django_db

SERIALIZED_RECEIPT_FIELDS = {"id", "date", "link", "totalPrice", "totalVat", "user", "companyUnit"}

FILTER_ALL = {
    **PERIOD,
    "id": "%",
    "unitName": "%",
    "tin": "%",
    "priceFrom": 0,
    "priceTo": 9999999,
    "orderBy": "date",
    "ascendingOrder": "asc",
}


def _ids(rows):
    return [row["id"] for row in rows]


# ----------------------------------------------------------
#  GET /api/receipts/ (uklonjeno, FE koristi /api/receipts/filter/)
# ----------------------------------------------------------

@pytest.mark.parametrize("client_fixture", ["regular_client", "admin_api_client"])
def test_receipts_list_is_removed(request, client_fixture, regular_user):
    #* Ranije je ADMIN ovde dobijao sve račune svih korisnika odjednom (bez paginacije)
    client = request.getfixturevalue(client_fixture)
    ReceiptFactory(user=regular_user)

    assert client.get("/api/receipts/").status_code == 405


# ----------------------------------------------------------
#  GET /api/receipts/filter/
# ----------------------------------------------------------

def test_receipts_filter_regular_all(regular_client, stats_data, auth_client):
    d = stats_data
    client = auth_client(d.alice)

    response = client.get("/api/receipts/filter/", FILTER_ALL)

    assert response.status_code == 200
    body = response.json()
    assert (body["pageCount"], body["pageNum"]) == (1, 1)
    #* A_OUT je van perioda, B1/B2 su tuđi
    assert _ids(body["receipts"]) == [d.a1.id, d.a2.id, d.a3.id, d.a4.id]


def test_receipts_filter_raw_row_shape(auth_client, stats_data):
    d = stats_data

    row = auth_client(d.alice).get("/api/receipts/filter/", FILTER_ALL).json()["receipts"][0]

    #* Raw SQL: DECIMAL -> broj, datum bez vremenske zone
    assert row == {
        "id": d.a1.id,
        "date": "2025-01-06T09:15:00",
        "link": d.a1.link,
        "companyUnit": d.u1.id,
        "user": d.alice.id,
        "totalPrice": 1000.0,
        "totalVat": 90.91,
    }


@pytest.mark.parametrize(
    "params, expected",
    [
        pytest.param({"unitName": "apoteka"}, ["a2"], id="naziv-prodajnog-mesta-case-insensitive"),
        pytest.param({"unitName": "ALFA"}, ["a1", "a3", "a4"], id="naziv-preduzeca"),
        pytest.param({"tin": "100000002"}, ["a2"], id="pib"),
        pytest.param({"tin": "1000"}, ["a1", "a2", "a3", "a4"], id="pib-prefiks"),
        pytest.param({"priceFrom": 200, "priceTo": 1000}, ["a1", "a2"], id="iznos-od-do-ukljucivo"),
        pytest.param({"dateFrom": "2025-02-01", "dateTo": "2025-03-01"}, ["a3"], id="period"),
        pytest.param({"orderBy": "totalPrice", "ascendingOrder": "desc"}, ["a3", "a1", "a2", "a4"], id="sort-iznos-desc"),
        pytest.param({"orderBy": "nepostojeca_kolona"}, ["a1", "a2", "a3", "a4"], id="nepoznat-orderBy-sort-po-datumu"),
    ],
)
def test_receipts_filter_params(auth_client, stats_data, params, expected):
    d = stats_data

    rows = auth_client(d.alice).get("/api/receipts/filter/", {**FILTER_ALL, **params}).json()["receipts"]

    assert _ids(rows) == [getattr(d, name).id for name in expected]


def test_receipts_filter_sort_by_unit_name(auth_client, stats_data):
    d = stats_data

    rows = auth_client(d.alice).get(
        "/api/receipts/filter/", {**FILTER_ALL, "orderBy": "unitName", "ascendingOrder": "desc"}
    ).json()["receipts"]

    #* A1 i A4 su u istom prodajnom mestu (redosled između njih nije definisan)
    assert [row["companyUnit"] for row in rows] == [d.u3.id, d.u2.id, d.u1.id, d.u1.id]


def test_receipts_filter_by_exact_id(auth_client, stats_data):
    d = stats_data

    rows = auth_client(d.alice).get("/api/receipts/filter/", {**FILTER_ALL, "id": d.a3.id}).json()["receipts"]

    assert _ids(rows) == [d.a3.id]


def test_receipts_filter_admin_deduplicates(admin_api_client, stats_data):
    d = stats_data

    rows = admin_api_client.get("/api/receipts/filter/", FILTER_ALL).json()["receipts"]

    assert _ids(rows) == [d.a1.id, d.a2.id, d.a3.id, d.b2.id, d.a4.id]


def test_receipts_filter_pagination(regular_client, regular_user):
    receipts = [ReceiptFactory(user=regular_user, date=utc(2025, 1, 1 + i, 12, 0)) for i in range(13)]

    page1 = regular_client.get("/api/receipts/filter/", FILTER_ALL).json()
    page2 = regular_client.get("/api/receipts/filter/", {**FILTER_ALL, "page": 2}).json()

    assert (page1["pageCount"], page1["pageNum"], len(page1["receipts"])) == (2, 1, 12)
    assert (page2["pageNum"], _ids(page2["receipts"])) == (2, [receipts[-1].id])


def test_receipts_filter_without_trailing_slash_redirects(regular_client, regular_user):
    #* receiptService.ts poziva "/api/receipts/filter?..." (bez "/") i neenkodovan "%"
    ReceiptFactory(user=regular_user, date=utc(2025, 1, 6, 9, 15))
    query = (
        "dateFrom=2025-01-01&dateTo=2025-12-31&id=%&unitName=%&tin=%&priceFrom=0&priceTo=9999999"
        "&orderBy=date&ascendingOrder=desc&page=1"
    )

    redirect = regular_client.get(f"/api/receipts/filter?{query}")
    followed = regular_client.get(f"/api/receipts/filter?{query}", follow=True)

    assert redirect.status_code == 301
    assert redirect["Location"].startswith("/api/receipts/filter/?")
    assert followed.status_code == 200
    assert len(followed.json()["receipts"]) == 1


def test_receipts_filter_without_required_params_returns_400(regular_client):
    params = dict(FILTER_ALL)
    del params["priceTo"]

    assert regular_client.get("/api/receipts/filter/", params).status_code == 400


# ----------------------------------------------------------
#  GET /api/receipts/<id>/
# ----------------------------------------------------------

def test_receipt_retrieve_own(regular_client, regular_user):
    receipt = ReceiptFactory(user=regular_user, date=utc(2025, 1, 6, 9, 15), totalPrice="1000.00", totalVat="90.91")

    response = regular_client.get(f"/api/receipts/{receipt.id}/")

    assert response.status_code == 200
    #* ModelSerializer: DECIMAL -> string, datum -> ISO sa "Z"
    assert response.json() == {
        "id": receipt.id,
        "date": "2025-01-06T09:15:00Z",
        "link": receipt.link,
        "totalPrice": "1000.00",
        "totalVat": "90.91",
        "user": regular_user.id,
        "companyUnit": receipt.companyUnit_id,
    }
    assert set(response.json()) == SERIALIZED_RECEIPT_FIELDS


def test_receipt_retrieve_of_other_user_returns_404(regular_client, other_regular_user):
    receipt = ReceiptFactory(user=other_regular_user)

    assert regular_client.get(f"/api/receipts/{receipt.id}/").status_code == 404


def test_receipt_retrieve_admin_sees_any_receipt(admin_api_client, regular_user):
    receipt = ReceiptFactory(user=regular_user)

    assert admin_api_client.get(f"/api/receipts/{receipt.id}/").status_code == 200


@pytest.mark.parametrize("receipt_id", ["999999", "abc"], ids=["nepostojeci", "neispravan"])
def test_receipt_retrieve_unknown_returns_404(regular_client, receipt_id):
    assert regular_client.get(f"/api/receipts/{receipt_id}/").status_code == 404


# ----------------------------------------------------------
#  GET /api/receipts/last/
# ----------------------------------------------------------

def test_last_receipt_is_latest_by_date(auth_client, stats_data):
    d = stats_data

    response = auth_client(d.alice).get("/api/receipts/last/")

    assert response.status_code == 200
    #* Raw SQL sa pozicionim indeksima kolona
    assert response.json() == {
        "id": d.a4.id,
        "date": "2025-03-02T00:30:00",
        "link": d.a4.link,
        "companyUnit": d.u1.id,
        "user": d.alice.id,
        "totalPrice": 120.0,
        "totalVat": 10.91,
    }
    assert auth_client(d.bob).get("/api/receipts/last/").json()["id"] == d.b2.id


def test_last_receipt_without_receipts_returns_404(regular_client):
    assert regular_client.get("/api/receipts/last/").status_code == 404


def test_last_receipt_for_admin_returns_403(admin_api_client):
    #* Prijavljen korisnik bez prava dobija 403 (401 je samo za neprijavljenog)
    assert admin_api_client.get("/api/receipts/last/").status_code == 403


# ----------------------------------------------------------
#  DELETE /api/receipts/<id>/
# ----------------------------------------------------------

def test_delete_own_receipt_deletes_items(regular_client, regular_user):
    item = ItemFactory(receipt__user=regular_user)

    response = regular_client.delete(f"/api/receipts/{item.receipt_id}/")

    assert response.status_code == 204
    assert not Receipt.objects.filter(id=item.receipt_id).exists()
    assert not Item.objects.filter(id=item.id).exists()


def test_delete_receipt_of_other_user_returns_404(regular_client, other_regular_user):
    receipt = ReceiptFactory(user=other_regular_user)

    assert regular_client.delete(f"/api/receipts/{receipt.id}/").status_code == 404
    assert Receipt.objects.filter(id=receipt.id).exists()


def test_admin_cannot_delete_receipt_of_user(admin_api_client, regular_user):
    receipt = ReceiptFactory(user=regular_user)

    assert admin_api_client.delete(f"/api/receipts/{receipt.id}/").status_code == 404
    assert Receipt.objects.filter(id=receipt.id).exists()
