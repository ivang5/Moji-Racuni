"""
Mali deterministički skup podataka za "golden" testove statistike (fixture `stats_data` u conftest.py).

Očekivane vrednosti u testovima su izračunate ručno iz tabele ispod; ako se skup menja, menjaju
se i očekivane vrednosti u test_api_statistics.py, test_api_companies.py i test_api_company_types.py.

Korisnici: alice, bob (REGULAR), admin (ADMIN, fixture admin_user).

Preduzeća / prodajna mesta / tipovi:
    C1 100000001 "Alfa Market"   U1 "Alfa Market 1", U2 "Alfa Market 2"   tipovi: alice "Market", bob "Prodavnica"
    C2 100000002 "Beta Apoteka"  U3 "Beta Apoteka Centar"                 tipovi: alice "Apoteka"
    C3 100000003 "Gama Pekara"   U4 "Gama Pekara Liman"                   tipovi: bob "Prodavnica"

Računi (redosled kreiranja = redosled id-jeva; vreme je "lokalno označeno kao UTC"):
    A1    alice 2025-01-06 09:15 (pon) U1 1000.00 / 90.91   link SHARED  mleko 120.00x2 L, hleb 60.00x1 KOM, sir 1400.00x0.5 KG
    A2    alice 2025-01-06 18:40 (pon) U3  250.50 / 41.75   link A2      aspirin 250.50x1 KUT
    A3    alice 2025-02-14 09:05 (pet) U2 3000.00 / 500.00  link A3      televizor 3000.00x1 KOM
    A4    alice 2025-03-02 00:30 (ned) U1  120.00 / 10.91   link A4      mleko 110.00x1 L, hleb 10.00x1 KOM
    A_OUT alice 2024-12-31 23:59 (uto) U1  999.99 / 90.91   link A_OUT   mleko 999.99x1 L         (van perioda 2025)
    B1    bob   2025-01-06 09:15 (pon) U1 1000.00 / 90.91   link SHARED  iste stavke kao A1       (ADMIN dedup -> izbacuje se)
    B2    bob   2025-02-20 13:00 (čet) U4  500.00 / 45.45   link B2      kifla 50.00x10 KOM

Period za statistiku: dateFrom=2025-01-01, dateTo=2025-12-31.
"""
from decimal import Decimal
from types import SimpleNamespace

from account.tests.factories import UserFactory
from company.tests.factories import CompanyFactory, CompanyTypeFactory, CompanyUnitFactory
from receipt.models import Item
from receipt.tests.factories import ItemFactory, ReceiptFactory, utc

PERIOD = {"dateFrom": "2025-01-01", "dateTo": "2025-12-31"}
LINK_PREFIX = "https://suf.purs.gov.rs/v/?vl=GOLDEN-"

KOM, KG, L, KUT = (Item.MeasurementUnit.KOM, Item.MeasurementUnit.KG, Item.MeasurementUnit.L, Item.MeasurementUnit.KUT)

A1_ITEMS = [
    ("mleko", L, 10, "120.00", "2.000"),
    ("hleb", KOM, 10, "60.00", "1.000"),
    ("sir", KG, 10, "1400.00", "0.500"),
]


def _receipt(user, date, unit, total, vat, link, items):
    receipt = ReceiptFactory(
        user=user,
        date=date,
        companyUnit=unit,
        totalPrice=Decimal(total),
        totalVat=Decimal(vat),
        link=LINK_PREFIX + link,
    )
    receipt.items = [
        ItemFactory(receipt=receipt, name=name, measurementUnit=unit_, vatType=vat_, price=Decimal(price), quantity=Decimal(qty))
        for name, unit_, vat_, price, qty in items
    ]
    return receipt


def build_stats_dataset(admin):
    alice = UserFactory(username="alice")
    bob = UserFactory(username="bob")

    alice_market = CompanyTypeFactory(user=alice, name="Market", description="Supermarketi")
    alice_apoteka = CompanyTypeFactory(user=alice, name="Apoteka", description="Apoteke")
    bob_prodavnica = CompanyTypeFactory(user=bob, name="Prodavnica", description="Sve prodavnice")

    c1 = CompanyFactory(tin=100000001, name="Alfa Market", type=[alice_market, bob_prodavnica])
    c2 = CompanyFactory(tin=100000002, name="Beta Apoteka", type=[alice_apoteka])
    c3 = CompanyFactory(tin=100000003, name="Gama Pekara", type=[bob_prodavnica])

    u1 = CompanyUnitFactory(company=c1, name="Alfa Market 1", address="Bulevar Oslobođenja 1")
    u2 = CompanyUnitFactory(company=c1, name="Alfa Market 2", address="Futoška 2")
    u3 = CompanyUnitFactory(company=c2, name="Beta Apoteka Centar", address="Zmaj Jovina 3")
    u4 = CompanyUnitFactory(company=c3, name="Gama Pekara Liman", address="Narodnog fronta 4")

    a1 = _receipt(alice, utc(2025, 1, 6, 9, 15), u1, "1000.00", "90.91", "SHARED", A1_ITEMS)
    a2 = _receipt(alice, utc(2025, 1, 6, 18, 40), u3, "250.50", "41.75", "A2", [("aspirin", KUT, 20, "250.50", "1.000")])
    a3 = _receipt(alice, utc(2025, 2, 14, 9, 5), u2, "3000.00", "500.00", "A3", [("televizor", KOM, 20, "3000.00", "1.000")])
    a4 = _receipt(alice, utc(2025, 3, 2, 0, 30), u1, "120.00", "10.91", "A4", [("mleko", L, 10, "110.00", "1.000"), ("hleb", KOM, 10, "10.00", "1.000")])
    a_out = _receipt(alice, utc(2024, 12, 31, 23, 59), u1, "999.99", "90.91", "A_OUT", [("mleko", L, 10, "999.99", "1.000")])
    b1 = _receipt(bob, utc(2025, 1, 6, 9, 15), u1, "1000.00", "90.91", "SHARED", A1_ITEMS)
    b2 = _receipt(bob, utc(2025, 2, 20, 13, 0), u4, "500.00", "45.45", "B2", [("kifla", KOM, 10, "50.00", "10.000")])

    return SimpleNamespace(
        alice=alice, bob=bob, admin=admin,
        alice_market=alice_market, alice_apoteka=alice_apoteka, bob_prodavnica=bob_prodavnica,
        c1=c1, c2=c2, c3=c3, u1=u1, u2=u2, u3=u3, u4=u4,
        a1=a1, a2=a2, a3=a3, a4=a4, a_out=a_out, b1=b1, b2=b2,
    )


# ----------------------------------------------------------
#  Pomoćne funkcije za očekivane liste "po satima/danima/mesecima"
# ----------------------------------------------------------

#* fill_empty_hours premešta sat 0 na kraj (redosled 1..23, 0)
HOURS_ORDER = list(range(1, 24)) + [0]


def by_hour(values, key):
    return [{"hourNum": h, key: values.get(h, 0)} for h in HOURS_ORDER]


def by_weekday(values, key):
    #* 1 = ponedeljak ... 7 = nedelja
    return [{"dayofweek": d, key: values.get(d, 0)} for d in range(1, 8)]


def by_month(values, key):
    return [{"monthNum": m, key: values.get(m, 0)} for m in range(1, 13)]
