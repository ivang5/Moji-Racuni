"""
Karakterizacioni testovi: stavke računa (/api/items/...).
Statistika stavki (most-valuable, most-items) je u test_api_statistics.py, unos u test_api_receipt_import.py.
"""
from decimal import Decimal

import pytest

from receipt.models import Item
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
#  GET /api/items/
# ----------------------------------------------------------

def test_items_list_for_admin_returns_all_items(admin_api_client, own_item, foreign_item):
    response = admin_api_client.get("/api/items/")

    assert response.status_code == 200
    assert sorted(i["id"] for i in response.json()) == sorted([own_item.id, foreign_item.id])


def test_items_list_for_regular_returns_401(regular_client):
    assert regular_client.get("/api/items/").status_code == 401


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


def test_items_of_unknown_receipt_returns_404(regular_client):
    assert regular_client.get("/api/items/999999/receipt/").status_code == 404


@pytest.mark.xfail(strict=True, reason="Bezbednosni propust: REGULAR čita stavke tuđeg računa")
def test_items_of_foreign_receipt_are_not_visible(regular_client, foreign_item):
    assert regular_client.get(f"/api/items/{foreign_item.receipt_id}/receipt/").status_code in (403, 404)


# ----------------------------------------------------------
#  GET /api/items/<id>/
# ----------------------------------------------------------

def test_item_retrieve_own(regular_client, own_item):
    response = regular_client.get(f"/api/items/{own_item.id}/")

    assert response.status_code == 200
    assert set(response.json()) == ITEM_FIELDS


def test_item_retrieve_unknown_returns_404(regular_client):
    assert regular_client.get("/api/items/999999/").status_code == 404


@pytest.mark.xfail(strict=True, reason="Bezbednosni propust: REGULAR čita stavku tuđeg računa")
def test_item_retrieve_foreign_is_forbidden(regular_client, foreign_item):
    assert regular_client.get(f"/api/items/{foreign_item.id}/").status_code in (403, 404)


# ----------------------------------------------------------
#  PUT /api/items/<id>/
# ----------------------------------------------------------

def test_item_update_own(regular_client, own_item):
    response = regular_client.put(f"/api/items/{own_item.id}/", _item_payload(own_item, name="mleko 2,8%"), format="json")

    assert response.status_code == 200
    assert response.json()["name"] == "mleko 2,8%"
    own_item.refresh_from_db()
    assert own_item.name == "mleko 2,8%"


def test_item_update_with_invalid_data_returns_400(regular_client, own_item):
    response = regular_client.put(f"/api/items/{own_item.id}/", _item_payload(own_item, vatType=15), format="json")

    assert response.status_code == 400
    assert "vatType" in response.json()


def test_item_update_by_admin_returns_401(admin_api_client, own_item):
    assert admin_api_client.put(f"/api/items/{own_item.id}/", _item_payload(own_item), format="json").status_code == 401


@pytest.mark.xfail(strict=True, reason="Bezbednosni propust: REGULAR menja stavku tuđeg računa")
def test_item_update_foreign_is_forbidden(regular_client, foreign_item):
    response = regular_client.put(
        f"/api/items/{foreign_item.id}/", _item_payload(foreign_item, price="0.01"), format="json"
    )

    assert response.status_code in (403, 404)
    foreign_item.refresh_from_db()
    assert foreign_item.price == Decimal("99.00")


# ----------------------------------------------------------
#  DELETE /api/items/<id>/
# ----------------------------------------------------------

def test_item_delete_own(regular_client, own_item):
    assert regular_client.delete(f"/api/items/{own_item.id}/").status_code == 204
    assert not Item.objects.filter(id=own_item.id).exists()


def test_item_delete_by_admin_returns_401(admin_api_client, own_item):
    assert admin_api_client.delete(f"/api/items/{own_item.id}/").status_code == 401
    assert Item.objects.filter(id=own_item.id).exists()


@pytest.mark.xfail(strict=True, reason="Bezbednosni propust: REGULAR briše stavku tuđeg računa")
def test_item_delete_foreign_is_forbidden(regular_client, foreign_item):
    response = regular_client.delete(f"/api/items/{foreign_item.id}/")

    assert response.status_code in (403, 404)
    assert Item.objects.filter(id=foreign_item.id).exists()
