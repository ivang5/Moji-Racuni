"""
Karakterizacioni testovi: prijave nepravilnosti na računu (/api/reports/...).
"""
import pytest

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
#  GET /api/reports/
# ----------------------------------------------------------

def test_reports_list_regular_sees_own(regular_client, reports):
    r1, r2, _ = reports

    response = regular_client.get("/api/reports/")

    assert response.status_code == 200
    body = response.json()
    assert (body["pageCount"], body["pageNum"]) == (1, 1)
    assert sorted(_ids(body["reports"])) == [r1.id, r2.id]
    assert set(body["reports"][0]) == REPORT_FIELDS


def test_reports_list_admin_sees_all(admin_api_client, reports):
    assert sorted(_ids(admin_api_client.get("/api/reports/").json()["reports"])) == sorted(r.id for r in reports)


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
    assert response.json()["request"] == "Pogrešan iznos"
    assert response.json()["date"] == "2025-04-01T10:00:00Z"


def test_report_retrieve_unknown_returns_404(regular_client):
    assert regular_client.get("/api/reports/999999/").status_code == 404


@pytest.mark.xfail(strict=True, reason="Bezbednosni propust: REGULAR čita tuđu prijavu")
def test_report_retrieve_foreign_is_forbidden(regular_client, reports):
    assert regular_client.get(f"/api/reports/{reports[2].id}/").status_code in (403, 404)


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


def test_last_report_for_regular_returns_401(regular_client):
    assert regular_client.get("/api/reports/last/").status_code == 401


# ----------------------------------------------------------
#  POST /api/reports/
# ----------------------------------------------------------

def test_create_report_for_own_receipt(regular_client, regular_user, other_regular_user):
    receipt = ReceiptFactory(user=regular_user)
    #* Isti oblik kao Receipts.tsx; polje user iz tela se ignoriše (postavlja se na prijavljenog korisnika)
    payload = {"date": "2025-05-01 12:00:00", "receipt": receipt.id, "request": "Pogrešna cena", "user": other_regular_user.id}

    response = regular_client.post("/api/reports/", payload, format="json")

    assert response.status_code == 201
    body = response.json()
    assert set(body) == REPORT_FIELDS
    assert body["user"] == regular_user.id
    assert (body["closed"], body["seen"], body["response"]) == (False, False, None)
    assert Report.objects.get(id=body["id"]).user == regular_user


def test_create_report_without_request_returns_400(regular_client, regular_user):
    receipt = ReceiptFactory(user=regular_user)

    response = regular_client.post("/api/reports/", {"date": "2025-05-01 12:00:00", "receipt": receipt.id}, format="json")

    assert response.status_code == 400
    assert "request" in response.json()


def test_create_report_by_admin_returns_401(admin_api_client, regular_user):
    receipt = ReceiptFactory(user=regular_user)

    response = admin_api_client.post(
        "/api/reports/", {"date": "2025-05-01 12:00:00", "receipt": receipt.id, "request": "x"}, format="json"
    )

    assert response.status_code == 401


@pytest.mark.xfail(strict=True, reason="Bezbednosni propust: REGULAR može da prijavi tuđi račun")
def test_create_report_for_foreign_receipt_is_rejected(regular_client, other_regular_user):
    receipt = ReceiptFactory(user=other_regular_user)

    response = regular_client.post(
        "/api/reports/", {"date": "2025-05-01 12:00:00", "receipt": receipt.id, "request": "Tuđi račun"}, format="json"
    )

    assert response.status_code in (400, 403, 404)
    assert not Report.objects.filter(receipt=receipt).exists()


@pytest.mark.xfail(strict=True, reason="Bezbednosni propust: datum prijave šalje klijent, a treba da ga postavlja server")
def test_create_report_date_is_set_by_server(regular_client, regular_user):
    receipt = ReceiptFactory(user=regular_user)

    response = regular_client.post("/api/reports/", {"receipt": receipt.id, "request": "Bez datuma"}, format="json")

    assert response.status_code == 201


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
    r1.refresh_from_db()
    assert (r1.response, r1.closed, r1.seen) == ("Hvala, ispravljeno.", True, False)


def test_update_report_with_invalid_data_returns_400(admin_api_client, reports):
    response = admin_api_client.put(f"/api/reports/{reports[0].id}/", {"response": "x"}, format="json")

    assert response.status_code == 400


@pytest.mark.xfail(strict=True, reason="Bezbednosni propust: REGULAR menja tuđu prijavu")
def test_regular_cannot_update_foreign_report(regular_client, reports):
    r3 = reports[2]
    payload = {
        "date": "2025-04-03T12:00:00Z", "request": "Izmenjeno", "response": None, "closed": False,
        "seen": False, "receipt": r3.receipt_id, "user": r3.user_id,
    }

    response = regular_client.put(f"/api/reports/{r3.id}/", payload, format="json")

    assert response.status_code in (403, 404)
    r3.refresh_from_db()
    assert r3.request == "Pogrešan datum"


@pytest.mark.xfail(strict=True, reason="Bezbednosni propust: REGULAR može sam da odgovori na/zatvori svoju prijavu")
def test_regular_cannot_respond_to_or_close_own_report(regular_client, reports):
    r1 = reports[0]
    payload = {
        "date": "2025-04-01T10:00:00Z", "request": r1.request, "response": "Sam sebi odgovaram", "closed": True,
        "seen": True, "receipt": r1.receipt_id, "user": r1.user_id,
    }

    regular_client.put(f"/api/reports/{r1.id}/", payload, format="json")

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


def test_set_seen_by_admin_returns_401(admin_api_client, reports):
    assert admin_api_client.put(f"/api/reports/{reports[1].id}/set-seen/").status_code == 401


@pytest.mark.xfail(strict=True, reason="Bezbednosni propust: REGULAR označava tuđu prijavu kao viđenu")
def test_set_seen_on_foreign_report_is_forbidden(regular_client, reports):
    r3 = reports[2]

    response = regular_client.put(f"/api/reports/{r3.id}/set-seen/")

    assert response.status_code in (403, 404)
    r3.refresh_from_db()
    assert r3.seen is False


# ----------------------------------------------------------
#  DELETE /api/reports/<id>/
# ----------------------------------------------------------

def test_regular_deletes_own_report(regular_client, reports):
    assert regular_client.delete(f"/api/reports/{reports[0].id}/").status_code == 204
    assert not Report.objects.filter(id=reports[0].id).exists()


def test_regular_cannot_delete_foreign_report(regular_client, reports):
    assert regular_client.delete(f"/api/reports/{reports[2].id}/").status_code == 401
    assert Report.objects.filter(id=reports[2].id).exists()


def test_admin_deletes_any_report(admin_api_client, reports):
    assert admin_api_client.delete(f"/api/reports/{reports[2].id}/").status_code == 204
    assert not Report.objects.filter(id=reports[2].id).exists()


def test_delete_unknown_report_returns_404(admin_api_client):
    assert admin_api_client.delete("/api/reports/999999/").status_code == 404
