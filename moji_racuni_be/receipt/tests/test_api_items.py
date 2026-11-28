"""
Testovi: stavke računa (/api/items/...).
Statistika stavki (most-valuable, most-items) je u test_api_statistics.py, unos u test_api_receipt_import.py.
"""
from decimal import Decimal

import pytest

from receipt.tests.factories import ItemFactory

pytestmark = pytest.mark.django_db

ITEM_FIELDS = {"id", "measurementUnit", "vatType", "name", "price", "quantity", "receipt"}


@pytest.fixture
def own_item(regular_user):
    return ItemFactory(
        receipt__user=regular_user, name="mleko", measurementUnit="L", vatType=10, price=Decimal("120.00"), quantity=Decimal("2.000")
    )


@pytest.fixture
def foreign_item(other_regular_user):
    return ItemFactory(receipt__user=other_regular_user, name="tuđa stavka", price=Decimal("99.00"))


def _item_payload(item, **overrides):
    payload = {
        "name": item.name,
        "measurementUnit": item.measurementUnit,
        "vatType": item.vatType,
        "price": str(item.price),
        "quantity": str(item.quantity),
        "receipt": item.receipt_id,
    }
    payload.update(overrides)
    return payload


# ----------------------------------------------------------
#  Uklonjeni endpoint-i (FE ih ne koristi): lista svih stavki, pojedinačna stavka
# ----------------------------------------------------------

def test_items_list_is_removed(admin_api_client, own_item):
    #* Ruta postoji zbog POST (unos stavki), GET više nije dozvoljen
    assert admin_api_client.get("/api/items/").status_code == 405


@pytest.mark.parametrize("client_fixture", ["regular_client", "admin_api_client"])
@pytest.mark.parametrize("item_fixture", ["own_item", "foreign_item"])
def test_single_item_endpoints_are_removed(request, client_fixture, item_fixture):
    client = request.getfixturevalue(client_fixture)
    item = request.getfixturevalue(item_fixture)
    url = f"/api/items/{item.id}/"

    assert client.get(url).status_code == 404
    assert client.put(url, _item_payload(item, price="0.01"), format="json").status_code == 404
    assert client.delete(url).status_code == 404
    item.refresh_from_db()
    assert item.price != Decimal("0.01")


# ----------------------------------------------------------
#  GET /api/items/<receipt_id>/receipt/
# ----------------------------------------------------------

def test_items_of_own_receipt(regular_client, own_item):
    second = ItemFactory(receipt=own_item.receipt, name="hleb")

    response = regular_client.get(f"/api/items/{own_item.receipt_id}/receipt/")

    assert response.status_code == 200
    body = response.json()
    assert [i["id"] for i in body] == [own_item.id, second.id]
    assert body[0] == {
        "id": own_item.id,
        "measurementUnit": "L",
        "vatType": 10,
        "name": "mleko",
        "price": "120.00",
        "quantity": "2.000",
        "receipt": own_item.receipt_id,
    }
    assert set(body[0]) == ITEM_FIELDS


@pytest.mark.parametrize("receipt_id", ["999999", "abc"], ids=["nepostojeci", "neispravan"])
def test_items_of_unknown_receipt_returns_404(regular_client, receipt_id):
    assert regular_client.get(f"/api/items/{receipt_id}/receipt/").status_code == 404


def test_items_of_foreign_receipt_are_not_visible(regular_client, foreign_item):
    assert regular_client.get(f"/api/items/{foreign_item.receipt_id}/receipt/").status_code == 404


def test_admin_sees_items_of_any_receipt(admin_api_client, foreign_item):
    response = admin_api_client.get(f"/api/items/{foreign_item.receipt_id}/receipt/")

    assert response.status_code == 200
    assert [i["id"] for i in response.json()] == [foreign_item.id]


def test_items_of_receipt_require_authentication(api_client, own_item):
    assert api_client.get(f"/api/items/{own_item.receipt_id}/receipt/").status_code == 401
