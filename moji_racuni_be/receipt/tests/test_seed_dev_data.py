"""
Testovi komande `python manage.py seed_dev_data`.
"""
from datetime import date
from decimal import ROUND_HALF_UP
from io import StringIO

import pytest
from django.core.management import CommandError, call_command
from django.db.models import Count

from account.models import User
from company.models import Company, CompanyType, CompanyUnit
from company.tests.factories import CompanyFactory
from receipt.management.commands import seed_dev_data as seed
from receipt.models import Item, Receipt, Report
from receipt.tests.factories import ReceiptFactory

pytestmark = pytest.mark.django_db

ANCHOR = "2026-01-15"


@pytest.fixture
def debug(settings):
    settings.DEBUG = True


def run(*args, **options):
    out = StringIO()
    call_command("seed_dev_data", *args, anchor_date=date.fromisoformat(ANCHOR), stdout=out, **options)
    return out.getvalue()


def counts():
    return {
        "users": User.objects.count(),
        "companies": Company.objects.count(),
        "units": CompanyUnit.objects.count(),
        "types": CompanyType.objects.count(),
        "receipts": Receipt.objects.count(),
        "items": Item.objects.count(),
        "reports": Report.objects.count(),
    }


def snapshot():
    return sorted(
        (r.user.username, r.link, r.date.isoformat(), str(r.totalPrice), str(r.totalVat), r.companyUnit.name, r.item_set.count())
        for r in Receipt.objects.select_related("user", "companyUnit")
    )


def test_refuses_to_run_without_debug(settings):
    settings.DEBUG = False

    with pytest.raises(CommandError, match="DEBUG=True"):
        call_command("seed_dev_data", stdout=StringIO())
    assert counts()["users"] == 0


def test_seeds_empty_database(debug):
    output = run()

    c = counts()
    assert c["users"] == 5
    assert c["companies"] == 10
    assert c["units"] == 15
    assert c["receipts"] == sum(n for n, _ in seed.REGULAR_USERS.values()) + len(seed.SHARED_RECEIPT_INDEXES)
    assert 90 <= c["receipts"] <= 120
    assert c["items"] > c["receipts"]
    assert c["reports"] == 5
    assert "qa_regular" in output and seed.DEFAULT_PASSWORD in output

    assert User.objects.get(username="qa_admin").role == "ADMIN"
    assert set(User.objects.exclude(username="qa_admin").values_list("role", flat=True)) == {"REGULAR"}
    assert User.objects.get(username="qa_regular_4").is_active is False
    assert all(c.name.startswith("[SEED] ") for c in Company.objects.all())
    assert all(r.link.startswith("https://suf.purs.gov.rs/v/?vl=SEED-") for r in Receipt.objects.all())


def test_seed_data_covers_variety_needed_for_manual_testing(debug):
    run()

    assert set(Item.objects.values_list("measurementUnit", flat=True)) == {"KOM", "KUT", "KG", "L", "M"}
    assert set(Item.objects.values_list("vatType", flat=True)) == {0, 10, 20}
    regular_receipts = Receipt.objects.filter(user__username="qa_regular")
    assert len({(r.date.year, r.date.month) for r in regular_receipts}) >= 12
    assert len({r.date.hour for r in regular_receipts}) >= 10
    assert len({r.date.isoweekday() for r in regular_receipts}) == 7
    #* Tekući mesec (u odnosu na anchor) ima račune -> početna strana ima "ovaj mesec"
    assert regular_receipts.filter(date__year=2026, date__month=1).count() >= seed.CURRENT_MONTH_RECEIPTS
    assert not Receipt.objects.filter(date__date__gt=ANCHOR).exists()
    #* Isti link kod dva korisnika -> ADMIN deduplikacija
    shared = Receipt.objects.values("link").annotate(n=Count("id")).filter(n__gt=1)
    assert shared.count() == len(seed.SHARED_RECEIPT_INDEXES)
    #* Prijave u svim stanjima
    states = set(Report.objects.values_list("closed", "seen"))
    assert states == {(False, False), (True, False), (True, True)}
    #* Ukupan iznos računa = zbir stavki
    for receipt in regular_receipts[:10]:
        lines = sum(
            (item.price * item.quantity).quantize(item.price, rounding=ROUND_HALF_UP) for item in receipt.item_set.all()
        )
        assert receipt.totalPrice == lines


def test_second_run_does_not_duplicate_data(debug):
    run()
    before, data_before = counts(), snapshot()

    output = run()

    assert counts() == before
    assert snapshot() == data_before
    assert "(novo: 0)" in output


def test_is_deterministic(debug):
    run()
    first = snapshot()

    run("--reset")

    assert snapshot() == first


def test_seed_users_can_log_in_with_seed_password(debug, api_client):
    run()

    for username in ("qa_regular", "qa_admin"):
        response = api_client.post("/api/token/", {"username": username, "password": seed.DEFAULT_PASSWORD}, format="json")
        assert response.status_code == 200


def test_password_can_be_set_from_env(debug, monkeypatch):
    monkeypatch.setenv("SEED_PASSWORD", "Druga-lozinka-1")

    run()

    assert User.objects.get(username="qa_regular").check_password("Druga-lozinka-1")


def test_rerun_resets_seed_user_password(debug):
    run()
    user = User.objects.get(username="qa_regular")
    user.set_password("promenjena")
    user.save()

    run()

    user.refresh_from_db()
    assert user.check_password(seed.DEFAULT_PASSWORD)


def test_delete_only_and_reset_remove_only_seed_data(debug, regular_user):
    own_receipt = ReceiptFactory(user=regular_user)
    run()

    run("--delete-only")

    assert counts() == {"users": 1, "companies": 1, "units": 1, "types": 0, "receipts": 1, "items": 0, "reports": 0}
    assert Receipt.objects.get().id == own_receipt.id

    run("--reset")
    assert Receipt.objects.filter(id=own_receipt.id).exists()
    assert User.objects.filter(username="qa_regular").exists()


def test_refuses_when_seed_tin_belongs_to_real_company(debug):
    CompanyFactory(tin=seed.SEED_TINS[0], name="Pravo preduzeće")

    with pytest.raises(CommandError, match="900000001"):
        run()
    assert not User.objects.filter(username="qa_regular").exists()
    assert Company.objects.get(tin=seed.SEED_TINS[0]).name == "Pravo preduzeće"
