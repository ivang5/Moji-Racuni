from datetime import datetime, timedelta, timezone
from decimal import Decimal

import factory
from factory.django import DjangoModelFactory

from account.tests.factories import UserFactory
from company.tests.factories import CompanyUnitFactory
from receipt.models import Item, Receipt, Report

#* Vreme računa se u aplikaciji čuva kao lokalno vreme "označeno" kao UTC
BASE_DATE = datetime(2025, 1, 1, 12, 0, tzinfo=timezone.utc)


def utc(*args):
    """utc(2025, 1, 6, 9, 15) -> aware datetime u UTC, kao što ga čuva aplikacija."""
    return datetime(*args, tzinfo=timezone.utc)


class ReceiptFactory(DjangoModelFactory):
    class Meta:
        model = Receipt

    date = factory.Sequence(lambda n: BASE_DATE + timedelta(days=n))
    link = factory.Sequence(lambda n: f"https://suf.purs.gov.rs/v/?vl=TEST-{n}")
    user = factory.SubFactory(UserFactory)
    totalPrice = Decimal("100.00")
    totalVat = Decimal("16.67")
    companyUnit = factory.SubFactory(CompanyUnitFactory)


class ItemFactory(DjangoModelFactory):
    class Meta:
        model = Item

    measurementUnit = Item.MeasurementUnit.KOM
    vatType = Item.VatType.OPSTI
    name = factory.Sequence(lambda n: f"stavka {n}")
    price = Decimal("100.00")
    quantity = Decimal("1.000")
    receipt = factory.SubFactory(ReceiptFactory)


class ReportFactory(DjangoModelFactory):
    """Prijava nepravilnosti; podrazumevano je podnosi vlasnik računa."""

    class Meta:
        model = Report

    date = factory.Sequence(lambda n: BASE_DATE + timedelta(days=n, hours=1))
    receipt = factory.SubFactory(ReceiptFactory)
    user = factory.SelfAttribute("receipt.user")
    request = factory.Sequence(lambda n: f"Prijava {n}: pogrešan iznos")
    response = None
    closed = False
    seen = False
