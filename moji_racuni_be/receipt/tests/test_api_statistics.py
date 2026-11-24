"""
"Golden" testovi statistike: tačni brojevi na determinističkom skupu (receipt/tests/datasets.py).

Na ove testove se oslanja svaki refaktor upita: odgovori moraju ostati identični, uključujući
redosled i tip vrednosti (raw SQL DECIMAL -> JSON broj, popunjene "prazne" vrednosti -> 0).
Svako namerno odstupanje (ispravka baga) se dokumentuje izmenom testa uz komentar.
"""
import base64

import pytest

from receipt.tests.datasets import PERIOD, by_hour, by_month, by_weekday
from receipt.tests.factories import ReceiptFactory, utc

pytestmark = pytest.mark.django_db


@pytest.fixture
def alice_client(auth_client, stats_data):
    return auth_client(stats_data.alice)


@pytest.fixture
def bob_client(auth_client, stats_data):
    return auth_client(stats_data.bob)


@pytest.fixture
def admin_stats_client(auth_client, stats_data):
    return auth_client(stats_data.admin)


def _get(client, path, **params):
    response = client.get(path, {**PERIOD, **params})
    assert response.status_code == 200, response.content
    return response.json()


# ----------------------------------------------------------
#  /api/receipts/total-spent/, most-spent-day/
# ----------------------------------------------------------

def test_total_spent_regular(alice_client):
    assert _get(alice_client, "/api/receipts/total-spent/") == {
        "totalSpent": 4370.5,
        "totalSpentVat": 643.57,
        "receiptsCount": 4,
        "mostSpentReceipt": 3000.0,
        "avgSpentReceipt": 1092.625,
    }


def test_total_spent_other_regular_sees_only_own_receipts(bob_client):
    assert _get(bob_client, "/api/receipts/total-spent/") == {
        "totalSpent": 1500.0,
        "totalSpentVat": 136.36,
        "receiptsCount": 2,
        "mostSpentReceipt": 1000.0,
        "avgSpentReceipt": 750.0,
    }


def test_total_spent_admin_deduplicates_receipts_by_link(admin_stats_client):
    #* A1 i B1 imaju isti link -> računa se samo jednom (MIN(id) = A1)
    assert _get(admin_stats_client, "/api/receipts/total-spent/") == {
        "totalSpent": 4870.5,
        "totalSpentVat": 689.02,
        "receiptsCount": 5,
        "mostSpentReceipt": 3000.0,
        "avgSpentReceipt": 974.1,
    }


def test_total_spent_for_user_without_receipts(regular_client):
    assert _get(regular_client, "/api/receipts/total-spent/") == {
        "totalSpent": None,
        "totalSpentVat": None,
        "receiptsCount": 0,
        "mostSpentReceipt": None,
        "avgSpentReceipt": None,
    }


def test_most_spent_day_regular_and_admin(alice_client, admin_stats_client):
    #* alice: 2025-01-06 = 1250.50, 2025-02-14 = 3000.00, 2025-03-02 = 120.00
    assert _get(alice_client, "/api/receipts/most-spent-day/") == {"mostSpent": 3000.0}
    assert _get(admin_stats_client, "/api/receipts/most-spent-day/") == {"mostSpent": 3000.0}


def test_most_spent_day_sums_receipts_of_the_same_day(alice_client):
    #* Samo januar: dva računa 2025-01-06 (1000.00 + 250.50)
    response = alice_client.get("/api/receipts/most-spent-day/", {"dateFrom": "2025-01-01", "dateTo": "2025-01-31"})

    assert response.json() == {"mostSpent": 1250.5}


# ----------------------------------------------------------
#  Po satima / danima / mesecima
# ----------------------------------------------------------

def test_receipts_count_by_hour(alice_client, admin_stats_client):
    assert _get(alice_client, "/api/receipts/hours-count/") == by_hour({9: 2, 18: 1, 0: 1}, "count")
    assert _get(admin_stats_client, "/api/receipts/hours-count/") == by_hour({9: 2, 13: 1, 18: 1, 0: 1}, "count")


def test_receipts_count_by_weekday(alice_client, admin_stats_client):
    assert _get(alice_client, "/api/receipts/weekdays-count/") == by_weekday({1: 2, 5: 1, 7: 1}, "count")
    assert _get(admin_stats_client, "/api/receipts/weekdays-count/") == by_weekday({1: 2, 4: 1, 5: 1, 7: 1}, "count")


def test_receipts_count_by_month(alice_client, admin_stats_client):
    assert _get(alice_client, "/api/receipts/months-count/") == by_month({1: 2, 2: 1, 3: 1}, "count")
    assert _get(admin_stats_client, "/api/receipts/months-count/") == by_month({1: 2, 2: 2, 3: 1}, "count")


def test_money_spent_by_hour(alice_client, admin_stats_client):
    assert _get(alice_client, "/api/receipts/hours-spent/") == by_hour({9: 4000.0, 18: 250.5, 0: 120.0}, "spent")
    assert _get(admin_stats_client, "/api/receipts/hours-spent/") == by_hour(
        {9: 4000.0, 13: 500.0, 18: 250.5, 0: 120.0}, "spent"
    )


def test_money_spent_by_weekday(alice_client, admin_stats_client):
    assert _get(alice_client, "/api/receipts/weekdays-spent/") == by_weekday({1: 1250.5, 5: 3000.0, 7: 120.0}, "spent")
    assert _get(admin_stats_client, "/api/receipts/weekdays-spent/") == by_weekday(
        {1: 1250.5, 4: 500.0, 5: 3000.0, 7: 120.0}, "spent"
    )


def test_money_spent_by_month(alice_client, admin_stats_client):
    assert _get(alice_client, "/api/receipts/months-spent/") == by_month({1: 1250.5, 2: 3000.0, 3: 120.0}, "spent")
    assert _get(admin_stats_client, "/api/receipts/months-spent/") == by_month({1: 1250.5, 2: 3500.0, 3: 120.0}, "spent")


def test_empty_period_returns_all_buckets_with_zero(regular_client):
    assert _get(regular_client, "/api/receipts/hours-count/") == by_hour({}, "count")
    assert _get(regular_client, "/api/receipts/weekdays-spent/") == by_weekday({}, "spent")
    assert _get(regular_client, "/api/receipts/months-count/") == by_month({}, "count")


# ----------------------------------------------------------
#  Granice perioda i format datuma koji šalje FE
# ----------------------------------------------------------

def test_date_to_is_compared_as_midnight_so_receipts_on_that_day_are_excluded(regular_client, regular_user):
    #* BETWEEN '2025-03-01' AND '2025-03-31' -> '2025-03-31 00:00:00'; FE zato šalje "sutra" kao dateTo
    ReceiptFactory(user=regular_user, date=utc(2025, 3, 31, 10, 0), totalPrice="100.00")
    ReceiptFactory(user=regular_user, date=utc(2025, 3, 1, 0, 0), totalPrice="50.00")

    in_march = regular_client.get("/api/receipts/total-spent/", {"dateFrom": "2025-03-01", "dateTo": "2025-03-31"})
    with_next_day = regular_client.get("/api/receipts/total-spent/", {"dateFrom": "2025-03-01", "dateTo": "2025-04-01"})

    assert in_march.json()["receiptsCount"] == 1
    assert with_next_day.json()["receiptsCount"] == 2


def test_date_to_with_trailing_slash_as_sent_by_fe(alice_client):
    #* statsService.ts šalje "...&dateTo=<datum>/" za hours/weekdays/months endpoint-e
    response = alice_client.get("/api/receipts/hours-count/?dateFrom=2025-01-01&dateTo=2025-12-31/")

    assert response.status_code == 200
    assert response.json() == by_hour({9: 2, 18: 1, 0: 1}, "count")


STAT_ENDPOINTS = [
    "/api/receipts/total-spent/",
    "/api/receipts/most-spent-day/",
    "/api/receipts/hours-count/",
    "/api/receipts/weekdays-count/",
    "/api/receipts/months-count/",
    "/api/receipts/hours-spent/",
    "/api/receipts/weekdays-spent/",
    "/api/receipts/months-spent/",
    "/api/items/most-items/",
    "/api/companies/visited/",
]


@pytest.mark.parametrize("path", STAT_ENDPOINTS)
@pytest.mark.parametrize("params", [{}, {"dateFrom": "2025-01-01"}, {"dateTo": "2025-12-31"}], ids=["bez-datuma", "bez-dateTo", "bez-dateFrom"])
def test_stat_endpoints_without_dates_return_400(regular_client, path, params):
    assert regular_client.get(path, params).status_code == 400


@pytest.mark.parametrize("path", STAT_ENDPOINTS)
def test_stat_endpoints_require_authentication(api_client, path):
    assert api_client.get(path, PERIOD).status_code == 401


# ----------------------------------------------------------
#  /api/items/most-valuable/, most-items/
# ----------------------------------------------------------

def _item_row(item):
    return {
        "id": item.id,
        "measurementUnit": item.measurementUnit,
        "name": item.name,
        "price": float(item.price),
        "quantity": float(item.quantity),
        "receipt": item.receipt_id,
        "vatType": item.vatType,
    }


def test_most_valuable_items_regular(alice_client, stats_data):
    d = stats_data
    #* Najviša cena po nazivu u periodu; mleko 999.99 sa računa van perioda se ne računa
    expected = [d.a3.items[0], d.a1.items[2], d.a2.items[0], d.a1.items[0], d.a1.items[1]]

    assert _get(alice_client, "/api/items/most-valuable/", limit=10) == [_item_row(i) for i in expected]
    assert _get(alice_client, "/api/items/most-valuable/", limit=3) == [_item_row(i) for i in expected[:3]]


def test_most_valuable_items_admin_uses_deduplicated_receipts(admin_stats_client, stats_data):
    d = stats_data
    #* B1 (isti link kao A1) se izbacuje -> stavke sa A1, ne sa B1 (bez dedup-a bi pobedio veći id, tj. B1)
    expected = [d.a3.items[0], d.a1.items[2], d.a2.items[0], d.a1.items[0], d.a1.items[1], d.b2.items[0]]

    assert _get(admin_stats_client, "/api/items/most-valuable/", limit=10) == [_item_row(i) for i in expected]


def test_most_valuable_items_with_invalid_limit_returns_400(alice_client):
    assert alice_client.get("/api/items/most-valuable/", {**PERIOD, "limit": "x"}).status_code == 400


def test_most_items_on_receipt(alice_client, bob_client, admin_stats_client):
    assert _get(alice_client, "/api/items/most-items/") == {"mostItems": 3, "avgItems": 1.75}
    assert _get(bob_client, "/api/items/most-items/") == {"mostItems": 3, "avgItems": 2.0}
    #* ADMIN: ovde NEMA deduplikacije po linku (B1 se računa): (3+1+1+2+3+1)/6
    assert _get(admin_stats_client, "/api/items/most-items/") == {"mostItems": 3, "avgItems": 1.8333}


# ----------------------------------------------------------
#  /api/receipts/plot/ (PDF statistika)
# ----------------------------------------------------------

def test_plot_returns_five_base64_png_images(alice_client, monkeypatch, tmp_path):
    #* plot_stat snima PNG fajlove u trenutni radni direktorijum
    monkeypatch.chdir(tmp_path)

    body = _get(alice_client, "/api/receipts/plot/", limit=10)

    assert set(body) == {"receipts", "spending", "companies", "types", "items"}
    for image in body.values():
        assert base64.b64decode(image).startswith(b"\x89PNG\r\n\x1a\n")


def test_plot_without_limit_returns_400(alice_client):
    assert alice_client.get("/api/receipts/plot/", PERIOD).status_code == 400
