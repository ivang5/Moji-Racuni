"""
Grafikoni za PDF (receipt/services/plots.py): bez upisa na disk i bez mešanja podataka između
istovremenih zahteva. Upiti se mock-uju (baza se ne koristi), a DPI se smanjuje zbog brzine.
"""
import base64
from concurrent.futures import ThreadPoolExecutor
from types import SimpleNamespace

import pytest

from receipt.services import plots

PLOT_NAMES = {"receipts", "spending", "companies", "types", "items"}


@pytest.fixture(autouse=True)
def fake_queries(monkeypatch):
    """Podaci zavise od user.factor, pa dva "korisnika" daju različite grafikone."""
    utils = plots.utils

    def series(key, count, value_key):
        return lambda user, dateFrom, dateTo: [{key: i, value_key: (i + 1) * user.factor} for i in range(count)]

    def top(label_key, value_key, labels):
        return lambda user, dateFrom, dateTo, limit: [
            {label_key: f"{label} {user.factor}", value_key: (n + 1) * user.factor} for n, label in enumerate(labels)
        ][:limit]

    monkeypatch.setattr(utils, "get_receipts_sum_by_hours", series("hourNum", 24, "count"))
    monkeypatch.setattr(utils, "get_money_spent_by_hours", series("hourNum", 24, "spent"))
    monkeypatch.setattr(utils, "get_receipts_sum_by_weekdays", series("dayofweek", 7, "count"))
    monkeypatch.setattr(utils, "get_money_spent_by_weekdays", series("dayofweek", 7, "spent"))
    monkeypatch.setattr(utils, "get_receipts_sum_by_months", series("monthNum", 12, "count"))
    monkeypatch.setattr(utils, "get_money_spent_by_months", series("monthNum", 12, "spent"))
    monkeypatch.setattr(utils, "get_most_spent_companies", top("companyName", "priceSum", ["Alfa", "Beta"]))
    monkeypatch.setattr(utils, "get_most_visited_companies", top("companyName", "receiptCount", ["Alfa", "Beta"]))
    monkeypatch.setattr(utils, "get_most_spent_types", top("companyType", "priceSum", ["Market"]))
    monkeypatch.setattr(utils, "get_most_visited_types", top("companyType", "receiptCount", ["Market"]))
    monkeypatch.setattr(utils, "get_most_valuable_items", top("name", "price", ["Mleko", "Hleb"]))
    monkeypatch.setattr(plots, "DPI", 30)


def _plots(factor):
    return plots.build_statistics_plots(SimpleNamespace(factor=factor), "2025-01-01", "2025-12-31")


def test_plots_are_png_images_and_nothing_is_written_to_disk(monkeypatch, tmp_path):
    monkeypatch.chdir(tmp_path)

    result = _plots(1)

    assert set(result) == PLOT_NAMES
    for image in result.values():
        assert base64.b64decode(image).startswith(b"\x89PNG\r\n\x1a\n")
    assert list(tmp_path.iterdir()) == []


def test_concurrent_requests_get_their_own_plots():
    expected = {1: _plots(1), 3: _plots(3)}
    assert expected[1] != expected[3]

    factors = [1, 3] * 4
    with ThreadPoolExecutor(max_workers=len(factors)) as pool:
        results = list(pool.map(_plots, factors))

    for factor, result in zip(factors, results):
        assert result == expected[factor]


def test_empty_pie_data_does_not_fail(monkeypatch):
    #* Npr. ADMIN nema svoje tipove preduzeća: zbir vrednosti je 0 ili nema vrednosti
    monkeypatch.setattr(plots.utils, "get_most_spent_types", lambda user, dateFrom, dateTo, limit: [])
    monkeypatch.setattr(
        plots.utils, "get_most_visited_types",
        lambda user, dateFrom, dateTo, limit: [{"companyType": "Market", "receiptCount": 0}],
    )

    assert set(_plots(1)) == PLOT_NAMES
