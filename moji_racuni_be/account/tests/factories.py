import factory
from factory.django import DjangoModelFactory

from account.models import User

DEFAULT_PASSWORD = "Test-lozinka-123"


class UserFactory(DjangoModelFactory):
    """REGULAR korisnik (uloga se postavlja u User.save() pri kreiranju, kao u aplikaciji)."""

    class Meta:
        model = User
        django_get_or_create = ("username",)
        skip_postgeneration_save = True

    username = factory.Sequence(lambda n: f"korisnik{n}")
    email = factory.LazyAttribute(lambda o: f"{o.username}@example.com")
    password = factory.django.Password(DEFAULT_PASSWORD)
    is_active = True


class AdminUserFactory(UserFactory):
    """ADMIN kao posle `createsuperuser`: is_superuser -> User.save() postavlja ulogu ADMIN."""

    username = factory.Sequence(lambda n: f"admin{n}")
    is_superuser = True
    is_staff = True
