"""
Greške pri preuzimanju računa sa PURS-a moraju da postanu 400/502, nikad 500.
Mreža se mock-uje, baza se ne koristi.
"""
from types import SimpleNamespace

import pytest
import requests
from rest_framework.test import APIRequestFactory, force_authenticate

from company.api.views import CompanyUnitViewSet, CompanyViewSet
from moji_racuni_be import utils

RECEIPT_URL = "https://suf.purs.gov.rs/v/?vl=TEST"


def _response(status_code, text=""):
    return SimpleNamespace(status_code=status_code, text=text)


@pytest.fixture
def fake_get(monkeypatch):
    """Zamenjuje requests.get; test postavlja fake_get.result (odgovor ili izuzetak)."""
    state = SimpleNamespace(result=_response(200, "<html></html>"), calls=[])

    def get(url, **kwargs):
        state.calls.append((url, kwargs))
        if isinstance(state.result, Exception):
            raise state.result
        return state.result

    monkeypatch.setattr(utils.requests, "get", get)
    return state


# ----------------------------------------------------------
#  _fetch_url_text
# ----------------------------------------------------------

def test_fetch_returns_page_text_and_does_not_follow_redirects(fake_get):
    fake_get.result = _response(200, "<html>račun</html>")
    assert utils._fetch_url_text(RECEIPT_URL) == "<html>račun</html>"
    assert fake_get.calls[0][1]["allow_redirects"] is False


@pytest.mark.parametrize(
    "url",
    [
        None, "", "nije-link", "ftp://suf.purs.gov.rs/v/", "http://suf.purs.gov.rs/v/", "https://suf.purs.gov.rs:abc/v/",
        "http://127.0.0.1/v/", "http://localhost/v/", "http://10.0.0.5/", "https://example.com/v/",
    ],
)
def test_fetch_rejects_invalid_or_private_url_without_request(fake_get, url):
    with pytest.raises(utils.InvalidReceiptError):
        utils._fetch_url_text(url)
    assert fake_get.calls == []


@pytest.mark.parametrize("status_code", [301, 302, 400, 403, 404])
def test_fetch_maps_redirect_and_client_error_to_invalid_receipt(fake_get, status_code):
    fake_get.result = _response(status_code)
    with pytest.raises(utils.InvalidReceiptError):
        utils._fetch_url_text(RECEIPT_URL)


@pytest.mark.parametrize(
    "result",
    [
        pytest.param(_response(500), id="500"),
        pytest.param(_response(503), id="503"),
        pytest.param(requests.exceptions.Timeout(), id="timeout"),
        pytest.param(requests.exceptions.ConnectionError(), id="connection-error"),
        pytest.param(requests.exceptions.SSLError(), id="ssl-error"),
    ],
)
def test_fetch_maps_server_and_network_errors_to_purs_unavailable(fake_get, result):
    fake_get.result = result
    with pytest.raises(utils.PursUnavailableError):
        utils._fetch_url_text(RECEIPT_URL)


def test_fetch_allows_hosts_from_settings(fake_get, settings):
    settings.PURS_ALLOWED_HOSTS = ["suf.purs.gov.rs", "Test.Example.com"]

    assert utils._fetch_url_text("https://test.example.com/v/?vl=X") == "<html></html>"
    assert utils._fetch_url_text("https://SUF.PURS.GOV.RS:443/v/?vl=X") == "<html></html>"


# ----------------------------------------------------------
#  Create endpoint-i (tok unosa računa)
# ----------------------------------------------------------

#* Korisnik bez baze: create view-ovi ispod ne pristupaju bazi pre preuzimanja računa
#* (unos stavki prvo proverava račun u bazi, pa je pokriven u test_api_receipt_import.py)
REGULAR_USER = SimpleNamespace(is_authenticated=True, role="REGULAR", id=1)

VIEWS = [
    pytest.param(CompanyViewSet, {"url": RECEIPT_URL}, id="companies"),
    pytest.param(CompanyUnitViewSet, {"url": RECEIPT_URL, "company": 999999999}, id="company-units"),
]


def _post(viewset, data):
    request = APIRequestFactory().post("/", data, format="json")
    force_authenticate(request, user=REGULAR_USER)
    return viewset.as_view({"post": "create"})(request)


@pytest.mark.parametrize("viewset, data", VIEWS)
@pytest.mark.parametrize(
    "result, expected_status",
    [
        pytest.param(_response(200, "<html><body>nije račun</body></html>"), 400, id="nepoznata-stranica"),
        pytest.param(_response(302), 400, id="redirect"),
        pytest.param(_response(400), 400, id="purs-400"),
        pytest.param(_response(503), 502, id="purs-503"),
        pytest.param(requests.exceptions.Timeout(), 502, id="timeout"),
    ],
)
def test_create_endpoints_return_4xx_or_502_instead_of_500(fake_get, viewset, data, result, expected_status):
    fake_get.result = result
    response = _post(viewset, data)
    assert response.status_code == expected_status
    assert set(response.data) == {"detail"}
