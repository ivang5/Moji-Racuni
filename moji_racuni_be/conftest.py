"""
Zajednički pytest fixture-i za BE testove.

- Korisnici: regular_user, other_regular_user, admin_user (factory-ji u */tests/factories.py).
- Klijenti: api_client (bez prijave), auth_client(user) (JWT "Bearer" header, kao FE).
- `pytest --endpoint-coverage`: na kraju ispisuje koji endpoint-i iz */api/urls.py (ruta + HTTP
  metod) su pogođeni bar jednim testom kroz api_client/auth_client.
"""
import os
import re

#* plot endpoint koristi pyplot; testovi se izvršavaju bez displeja
os.environ.setdefault("MPLBACKEND", "Agg")

import pytest
from django.urls import Resolver404, URLResolver, get_resolver
from rest_framework.routers import APIRootView
from rest_framework.test import APIClient

from account.tests.factories import AdminUserFactory, UserFactory

# ----------------------------------------------------------
#  Klijenti i korisnici
# ----------------------------------------------------------

#* (view funkcija, HTTP metod) svih zahteva poslatih kroz test klijente u ovoj sesiji
_ENDPOINT_HITS = set()


class RecordingAPIClient(APIClient):
    """APIClient koji beleži pogođene endpoint-e (za --endpoint-coverage)."""

    def request(self, **kwargs):
        response = super().request(**kwargs)
        try:
            func = response.resolver_match.func
        except Resolver404:
            return response
        _ENDPOINT_HITS.add((func, kwargs["REQUEST_METHOD"].upper()))
        return response


@pytest.fixture
def api_client():
    return RecordingAPIClient()


@pytest.fixture
def auth_client(db):
    """auth_client(user) -> klijent sa access tokenom korisnika (isti claim-ovi kao /api/token/)."""
    from account.api.views import MyTokenObtainPairSerializer

    def make_client(user):
        client = RecordingAPIClient()
        token = MyTokenObtainPairSerializer.get_token(user).access_token
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        return client

    return make_client


@pytest.fixture
def regular_user(db):
    return UserFactory(username="regular", email="regular@example.com")


@pytest.fixture
def other_regular_user(db):
    return UserFactory(username="other_regular", email="other_regular@example.com")


@pytest.fixture
def admin_user(db):
    #* Namerno prepisuje istoimeni pytest-django fixture: ADMIN uloga kao posle createsuperuser
    return AdminUserFactory(username="admin", email="admin@example.com")


@pytest.fixture
def regular_client(auth_client, regular_user):
    return auth_client(regular_user)


@pytest.fixture
def other_client(auth_client, other_regular_user):
    return auth_client(other_regular_user)


@pytest.fixture
def admin_api_client(auth_client, admin_user):
    return auth_client(admin_user)


@pytest.fixture
def stats_data(admin_user):
    """Deterministički skup podataka za golden testove statistike (opis u receipt/tests/datasets.py)."""
    from receipt.tests.datasets import build_stats_dataset

    return build_stats_dataset(admin_user)


# ----------------------------------------------------------
#  --endpoint-coverage
# ----------------------------------------------------------

def pytest_addoption(parser):
    parser.addoption(
        "--endpoint-coverage",
        action="store_true",
        default=False,
        help="Na kraju ispisati koji API endpoint-i (ruta + metod) su pogođeni testovima.",
    )


def _readable_route(route):
    route = re.sub(r"\(\?P<(\w+)>[^)]*\)", r"<\1>", route)
    return route.replace("^", "").replace("$", "")


def _iter_url_patterns(patterns, prefix=""):
    for pattern in patterns:
        if isinstance(pattern, URLResolver):
            yield from _iter_url_patterns(pattern.url_patterns, prefix + str(pattern.pattern))
        else:
            yield prefix + str(pattern.pattern), pattern.callback


def _view_methods(callback):
    actions = getattr(callback, "actions", None)
    if actions:
        methods = actions.keys()
    else:
        view_class = getattr(callback, "cls", None)
        methods = [m for m in getattr(view_class, "http_method_names", []) if hasattr(view_class, m)]
    return sorted(m.upper() for m in methods if m not in ("head", "options"))


def api_endpoint_inventory():
    """{view funkcija: (ruta, [metodi])} za sve rute ispod api/ (bez DRF API root-a i .json sufiksa)."""
    inventory = {}
    for route, callback in _iter_url_patterns(get_resolver().url_patterns):
        if not route.startswith("api/"):
            continue
        view_class = getattr(callback, "cls", None)
        if view_class is not None and issubclass(view_class, APIRootView):
            continue
        readable = _readable_route(route)
        #* Ista view funkcija je registrovana i sa format sufiksom (receipts.json); zadržati kraću rutu
        if callback not in inventory or len(readable) < len(inventory[callback][0]):
            inventory[callback] = (readable, _view_methods(callback))
    return inventory


def pytest_terminal_summary(terminalreporter, exitstatus, config):
    if not config.getoption("--endpoint-coverage"):
        return
    rows = []
    for callback, (route, methods) in api_endpoint_inventory().items():
        for method in methods:
            rows.append((route, method, (callback, method) in _ENDPOINT_HITS))
    rows.sort()
    covered = sum(1 for row in rows if row[2])
    terminalreporter.section(f"API endpoint coverage: {covered}/{len(rows)}")
    for route, method, hit in rows:
        terminalreporter.write_line(f"{'[x]' if hit else '[ ]'} {method:<6} /{route}")
