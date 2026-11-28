from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models.functions import Lower
from django.utils import translation
from rest_framework import serializers

from account.models import User

USER_FIELDS = ['id', 'username', 'email', 'role', 'date_joined', 'is_active']

#* Poruke Django validatora lozinke se vraćaju na srpskom (latinica), jer ih FE prikazuje korisniku
VALIDATION_LANGUAGE = 'sr-latn'


def _validate_new_password(password, user):
    with translation.override(VALIDATION_LANGUAGE):
        try:
            validate_password(password, user)
        except DjangoValidationError as e:
            raise serializers.ValidationError({'password': list(e.messages)}) from e


def _validate_unique_email(email, instance=None):
    #* Baza koristi binarni collation (LIKE/iexact razlikuju velika i mala slova), zato LOWER()
    users = User.objects.annotate(email_lower=Lower('email')).filter(email_lower=email.lower())
    if instance is not None:
        users = users.exclude(pk=instance.pk)
    if users.exists():
        raise serializers.ValidationError("Korisnik sa ovom email adresom već postoji.")
    return email


class UserSerializer(serializers.ModelSerializer):
    """Prikaz korisnika (detalji, odgovori na registraciju i izmenu)."""

    class Meta:
        model = User
        fields = USER_FIELDS
        read_only_fields = USER_FIELDS


class RegistrationSerializer(serializers.ModelSerializer):
    """Registracija: klijent zadaje samo korisničko ime, email i lozinku."""

    email = serializers.EmailField(max_length=254)
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    class Meta:
        model = User
        fields = [*USER_FIELDS, 'password']
        read_only_fields = ['id', 'role', 'date_joined', 'is_active']

    def validate_email(self, value):
        return _validate_unique_email(value)

    def validate(self, attrs):
        _validate_new_password(attrs['password'], User(username=attrs['username'], email=attrs['email']))
        return attrs

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class UserUpdateSerializer(serializers.ModelSerializer):
    """Izmena sopstvenih podataka (korisničko ime i email)."""

    email = serializers.EmailField(max_length=254)

    class Meta:
        model = User
        fields = ['username', 'email']

    def validate_email(self, value):
        return _validate_unique_email(value, self.instance)


class AdminUserUpdateSerializer(UserUpdateSerializer):
    """Izmena drugog korisnika od strane administratora: dodatno (de)aktivacija naloga."""

    class Meta(UserUpdateSerializer.Meta):
        fields = [*UserUpdateSerializer.Meta.fields, 'is_active']
        extra_kwargs = {'is_active': {'required': False}}


class PasswordChangeSerializer(serializers.Serializer):
    """Promena sopstvene lozinke; user (trenutni korisnik) se prosleđuje kroz context."""

    currentPassword = serializers.CharField(write_only=True, trim_whitespace=False)
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_currentPassword(self, value):
        if not self.context['user'].check_password(value):
            raise serializers.ValidationError("Trenutna lozinka nije ispravna.")
        return value

    def validate(self, attrs):
        _validate_new_password(attrs['password'], self.context['user'])
        return attrs
