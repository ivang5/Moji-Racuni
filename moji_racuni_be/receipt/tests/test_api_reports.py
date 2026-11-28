"""
Testovi: prijave nepravilnosti na računu (/api/reports/...).

Prijavljen korisnik bez prava na akciju dobija 403; tuđa prijava se REGULAR korisniku ponaša kao
nepostojeća (404).
"""
import datetime as dt
from zoneinfo import ZoneInfo

import pytest
from django.utils import timezone

from receipt.models import Report
from receipt.tests.factories import ReceiptFactory, ReportFactory, utc

pytestmark = pytest.mark.django_db

REPORT_FIELDS = {"id", "date", "request", "response", "closed", "seen", "receipt", "user"}

FILTER_ALL = {
    "dateFrom": "2025-01-01",
    "dateTo": "2025-12-31",
    "id": "%",
    "receipt": "%",
    "user": "%",
    "request": "%",
    "orderBy": "date",
    "ascendingOrder": "asc",
}


@pytest.fixture
def reports(regular_user, other_regular_user):
    """r1, r2 = prijave korisnika `regular` (otvorena; zatvorena sa odgovorom), r3 = prijava `other_regular`."""
    r1 = ReportFactory(receipt__user=regular_user, date=utc(2025, 4, 1, 10, 0), request="Pogrešan iznos")
    r2 = ReportFactory(
        receipt__user=regular_user, date=utc(2025, 4, 2, 11, 0), request="Nedostaje stavka",
        response="Ispravljeno", closed=True, seen=False,
    )
    r3 = ReportFactory(receipt__user=other_regular_user, date=utc(2025, 4, 3, 12, 0), request="Pogrešan datum")
    return r1, r2, r3


def _ids(rows):
    return [row["id"] for row in rows]


# ----------------------------------------------------------
#  GET /api/reports/ (uklonjeno, FE koristi /api/reports/filter/)
# ----------------------------------------------------------

@pytest.mark.parametrize("client_fixture", ["regular_client", "admin_api_client"])
def test_reports_list_is_removed(request, client_fixture, reports):
    client = request.getfixturevalue(client_fixture)

    assert client.get("/api/reports/").status_code == 405


# ----------------------------------------------------------
#  GET /api/reports/filter/
# ----------------------------------------------------------

def test_reports_filter_regular(regular_client, reports):
    r1, r2, _ = reports

    response = regular_client.get("/api/reports/filter/", FILTER_ALL)

    assert response.status_code == 200
    body = response.json()
    assert _ids(body["reports"]) == [r1.id, r2.id]
    #* Raw SQL: closed/seen su 0/1 (ne true/false), datum bez vremenske zone
    assert body["reports"][1] == {
        "id": r2.id,
        "date": "2025-04-02T11:00:00",
        "request": "Nedostaje stavka",
        "response": "Ispravljeno",
        "closed": 1,
        "seen": 0,
        "receipt": r2.receipt_id,
        "user": r2.user_id,
    }


def test_reports_filter_admin(admin_api_client, reports):
    r1, r2, r3 = reports

    all_rows = admin_api_client.get("/api/reports/filter/", {**FILTER_ALL, "ascendingOrder": "desc"}).json()["reports"]
    by_user = admin_api_client.get("/api/reports/filter/", {**FILTER_ALL, "user": "other"}).json()["reports"]
    by_request = admin_api_client.get("/api/reports/filter/", {**FILTER_ALL, "request": "Pogrešan"}).json()["reports"]
    by_receipt = admin_api_client.get("/api/reports/filter/", {**FILTER_ALL, "receipt": r2.receipt_id}).json()["reports"]

    assert _ids(all_rows) == [r3.id, r2.id, r1.id]
    assert _ids(by_user) == [r3.id]
    assert _ids(by_request) == [r1.id, r3.id]
    assert _ids(by_receipt) == [r2.id]


def test_reports_filter_regular_cannot_filter_by_other_users(regular_client, reports):
    #* Za REGULAR se parametar user ignoriše, vide se samo sopstvene prijave
    rows = regular_client.get("/api/reports/filter/", {**FILTER_ALL, "user": "other"}).json()["reports"]

    assert _ids(rows) == [reports[0].id, reports[1].id]


def test_reports_filter_without_required_params_returns_400(regular_client):
    params = dict(FILTER_ALL)
    del params["request"]

    assert regular_client.get("/api/reports/filter/", params).status_code == 400


# ----------------------------------------------------------
#  GET /api/reports/<id>/
# ----------------------------------------------------------

def test_report_retrieve_own(regular_client, reports):
    response = regular_client.get(f"/api/reports/{reports[0].id}/")

    assert response.status_code == 200
    assert set(response.json()) == REPORT_FIELDS
    assert response.json()["request"] == "Pogrešan iznos"
    assert response.json()["date"] == "2025-04-01T10:00:00Z"


def test_report_retrieve_admin_sees_any_report(admin_api_client, reports):
    assert admin_api_client.get(f"/api/reports/{reports[2].id}/").status_code == 200


def test_report_retrieve_unknown_returns_404(regular_client):
    assert regular_client.get("/api/reports/999999/").status_code == 404


def test_report_retrieve_foreign_is_forbidden(regular_client, reports):
    assert regular_client.get(f"/api/reports/{reports[2].id}/").status_code == 404


# ----------------------------------------------------------
#  GET /api/reports/last/
# ----------------------------------------------------------

def test_last_report_for_admin(admin_api_client, reports):
    r3 = reports[2]

    response = admin_api_client.get("/api/reports/last/")

    assert response.status_code == 200
    assert response.json() == {
        "id": r3.id,
        "date": "2025-04-03T12:00:00",
        "request": "Pogrešan datum",
        "response": None,
        "closed": 0,
        "seen": 0,
        "receipt": r3.receipt_id,
        "user": r3.user_id,
    }


def test_last_report_without_reports_returns_404(admin_api_client):
    assert admin_api_client.get("/api/reports/last/").status_code == 404


def test_last_report_for_regular_returns_403(regular_client):
    assert regular_client.get("/api/reports/last/").status_code == 403


# ----------------------------------------------------------
#  POST /api/reports/
# ----------------------------------------------------------

def test_create_report_for_own_receipt(regular_client, regular_user):
    receipt = ReceiptFactory(user=regular_user)
    #* Isti oblik kao Receipts.tsx
    payload = {"receipt": receipt.id, "request": "Pogrešna cena"}

    response = regular_client.post("/api/reports/", payload, format="json")

    assert response.status_code == 201
    body = response.json()
    assert set(body) == REPORT_FIELDS
    assert (body["user"], body["receipt"], body["request"]) == (regular_user.id, receipt.id, "Pogrešna cena")
    assert (body["closed"], body["seen"], body["response"]) == (False, False, None)
    assert Report.objects.get(id=body["id"]).user == regular_user


def test_create_report_ignores_server_side_fields(regular_client, regular_user, other_regular_user):
    receipt = ReceiptFactory(user=regular_user)
    payload = {
        "receipt": receipt.id, "request": "Pogrešna cena", "date": "2000-01-01 12:00:00", "user": other_regular_user.id,
        "response": "Sam sebi odgovaram", "closed": True, "seen": True,
    }

    response = regular_client.post("/api/reports/", payload, format="json")

    assert response.status_code == 201
    report = Report.objects.get(id=response.json()["id"])
    assert report.user == regular_user
    assert report.date.year != 2000
    assert (report.response, report.closed, report.seen) == (None, False, False)


def test_create_report_without_request_returns_400(regular_client, regular_user):
    receipt = ReceiptFactory(user=regular_user)

    response = regular_client.post("/api/reports/", {"receipt": receipt.id}, format="json")

    assert response.status_code == 400
    assert "request" in response.json()


def test_create_report_by_admin_returns_403(admin_api_client, regular_user):
    receipt = ReceiptFactory(user=regular_user)

    response = admin_api_client.post("/api/reports/", {"receipt": receipt.id, "request": "x"}, format="json")

    assert response.status_code == 403
    assert not Report.objects.exists()


def test_create_report_for_foreign_receipt_is_rejected(regular_client, other_regular_user):
    receipt = ReceiptFactory(user=other_regular_user)

    response = regular_client.post("/api/reports/", {"receipt": receipt.id, "request": "Tuđi račun"}, format="json")

    #* Tuđi račun se ponaša kao nepostojeći
    assert response.status_code == 400
    assert response.json() == {"receipt": [f'Invalid pk "{receipt.id}" - object does not exist.']}
    assert not Report.objects.filter(receipt=receipt).exists()


def test_create_report_date_is_set_by_server(regular_client, regular_user):
    receipt = ReceiptFactory(user=regular_user)

    response = regular_client.post("/api/reports/", {"receipt": receipt.id, "request": "Bez datuma"}, format="json")

    assert response.status_code == 201
    #* Kao i vreme računa: lokalno (srpsko) vreme označeno kao UTC, bez mikrosekundi
    local_now = timezone.now().astimezone(ZoneInfo("Europe/Belgrade")).replace(tzinfo=dt.timezone.utc)
    report_date = Report.objects.get(id=response.json()["id"]).date
    assert report_date.microsecond == 0
    assert abs(report_date - local_now) < dt.timedelta(minutes=1)


# ----------------------------------------------------------
#  PUT /api/reports/<id>/
# ----------------------------------------------------------

def test_admin_responds_to_report(admin_api_client, reports):
    r1 = reports[0]
    #* Isti oblik kao Reports.tsx (odgovor administratora)
    payload = {
        "date": "2025-04-01T10:00:00Z",
        "request": r1.request,
        "response": "Hvala, ispravljeno.",
        "closed": True,
        "seen": False,
        "receipt": r1.receipt_id,
        "user": r1.user_id,
    }

    response = admin_api_client.put(f"/api/reports/{r1.id}/", payload, format="json")

    assert response.status_code == 200
    assert set(response.json()) == REPORT_FIELDS
    r1.refresh_from_db()
    assert (r1.response, r1.closed, r1.seen) == ("Hvala, ispravljeno.", True, False)


def test_admin_response_changes_only_response_and_closed(admin_api_client, reports, other_regular_user):
    r2 = reports[1]
    r2.seen = True
    r2.save()
    original = (r2.date, r2.request, r2.receipt_id, r2.user_id)
    payload = {
        "date": "2000-01-01T00:00:00Z", "request": "Izmenjeno", "response": "Novi odgovor", "closed": True,
        "seen": True, "receipt": reports[2].receipt_id, "user": other_regular_user.id,
    }

    response = admin_api_client.put(f"/api/reports/{r2.id}/", payload, format="json")

    assert response.status_code == 200
    r2.refresh_from_db()
    assert (r2.date, r2.request, r2.receipt_id, r2.user_id) == original
    #* Nov odgovor korisnik još nije video
    assert (r2.response, r2.closed, r2.seen) == ("Novi odgovor", True, False)


@pytest.mark.parametrize("payload", [{}, {"response": ""}, {"closed": True}], ids=["prazno", "prazan-odgovor", "bez-odgovora"])
def test_update_report_without_response_returns_400(admin_api_client, reports, payload):
    response = admin_api_client.put(f"/api/reports/{reports[0].id}/", payload, format="json")

    assert response.status_code == 400
    assert "response" in response.json()


def test_update_unknown_report_returns_404(admin_api_client):
    assert admin_api_client.put("/api/reports/999999/", {"response": "x"}, format="json").status_code == 404


def test_regular_cannot_update_foreign_report(regular_client, reports):
    r3 = reports[2]
    payload = {
        "date": "2025-04-03T12:00:00Z", "request": "Izmenjeno", "response": None, "closed": False,
        "seen": False, "receipt": r3.receipt_id, "user": r3.user_id,
    }

    response = regular_client.put(f"/api/reports/{r3.id}/", payload, format="json")

    assert response.status_code == 403
    r3.refresh_from_db()
    assert r3.request == "Pogrešan datum"


def test_regular_cannot_respond_to_or_close_own_report(regular_client, reports):
    r1 = reports[0]
    payload = {
        "date": "2025-04-01T10:00:00Z", "request": r1.request, "response": "Sam sebi odgovaram", "closed": True,
        "seen": True, "receipt": r1.receipt_id, "user": r1.user_id,
    }

    response = regular_client.put(f"/api/reports/{r1.id}/", payload, format="json")

    assert response.status_code == 403
    r1.refresh_from_db()
    assert (r1.response, r1.closed) == (None, False)


# ----------------------------------------------------------
#  PUT /api/reports/<id>/set-seen/
# ----------------------------------------------------------

def test_set_seen_on_own_report(regular_client, reports):
    r2 = reports[1]

    response = regular_client.put(f"/api/reports/{r2.id}/set-seen/")

    assert response.status_code == 200
    assert response.json()["seen"] is True
    r2.refresh_from_db()
    assert r2.seen is True


def test_set_seen_by_admin_returns_403(admin_api_client, reports):
    assert admin_api_client.put(f"/api/reports/{reports[1].id}/set-seen/").status_code == 403


def test_set_seen_on_foreign_report_is_forbidden(regular_client, reports):
    r3 = reports[2]

    response = regular_client.put(f"/api/reports/{r3.id}/set-seen/")

    assert response.status_code == 404
    r3.refresh_from_db()
    assert r3.seen is False


# ----------------------------------------------------------
#  DELETE /api/reports/<id>/
# ----------------------------------------------------------

def test_regular_deletes_own_report(regular_client, reports):
    assert regular_client.delete(f"/api/reports/{reports[0].id}/").status_code == 204
    assert not Report.objects.filter(id=reports[0].id).exists()


def test_regular_cannot_delete_foreign_report(regular_client, reports):
    assert regular_client.delete(f"/api/reports/{reports[2].id}/").status_code == 404
    assert Report.objects.filter(id=reports[2].id).exists()


def test_admin_deletes_any_report(admin_api_client, reports):
    assert admin_api_client.delete(f"/api/reports/{reports[2].id}/").status_code == 204
    assert not Report.objects.filter(id=reports[2].id).exists()


def test_delete_unknown_report_returns_404(admin_api_client):
    assert admin_api_client.delete("/api/reports/999999/").status_code == 404
