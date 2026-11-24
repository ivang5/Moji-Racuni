import factory
from factory.django import DjangoModelFactory

from account.tests.factories import UserFactory
from company.models import Company, CompanyType, CompanyUnit


class CompanyFactory(DjangoModelFactory):
    """Preduzeće; tipovi se dodeljuju sa CompanyFactory(type=[tip1, tip2])."""

    class Meta:
        model = Company
        skip_postgeneration_save = True

    tin = factory.Sequence(lambda n: 100000000 + n)
    name = factory.Sequence(lambda n: f"Preduzeće {n}")
    image = None

    @factory.post_generation
    def type(self, create, extracted, **kwargs):
        if create and extracted:
            self.type.add(*extracted)


class CompanyUnitFactory(DjangoModelFactory):
    class Meta:
        model = CompanyUnit

    name = factory.Sequence(lambda n: f"Prodajno mesto {n}")
    address = factory.Sequence(lambda n: f"Ulica {n}")
    place = "Novi Sad"
    municipality = "Novi Sad"
    category = "Promet\nProdaja"
    company = factory.SubFactory(CompanyFactory)


class CompanyTypeFactory(DjangoModelFactory):
    class Meta:
        model = CompanyType

    name = factory.Sequence(lambda n: f"Tip {n}")
    description = factory.LazyAttribute(lambda o: f"Opis tipa {o.name}")
    user = factory.SubFactory(UserFactory)
