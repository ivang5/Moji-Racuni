from django.conf import settings
from rest_framework import serializers

from company.models import Company, CompanyType, CompanyUnit

#* Pillow format -> ekstenzija fajla; drugi formati (gif, bmp, svg...) se ne prihvataju
COMPANY_IMAGE_FORMATS = {"JPEG": "jpg", "PNG": "png", "WEBP": "webp"}
COMPANY_IMAGE_MAX_DIMENSION = 4096


class CompanySerializer(serializers.ModelSerializer):
    #* Bez polja type: veza preduzeća sa tipovima sadrži tipove svih korisnika
    class Meta:
        model = Company
        fields = ['tin', 'name', 'image']
        read_only_fields = ['image']


class CompanyUnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanyUnit
        fields = ['id', 'name', 'address', 'place', 'municipality', 'category', 'company']


class CompanyTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanyType
        fields = ['id', 'name', 'description', 'user']
        #* Vlasnik je uvek prijavljeni korisnik (postavlja ga view)
        read_only_fields = ['user']


class CompanyImageSerializer(serializers.Serializer):
    """Logo preduzeća: jpg/png/webp, najviše COMPANY_IMAGE_MAX_SIZE bajtova i 4096 px po strani."""

    img = serializers.ImageField()

    def validate_img(self, value):
        max_size = settings.COMPANY_IMAGE_MAX_SIZE
        if value.size > max_size:
            raise serializers.ValidationError(f"Slika može imati najviše {max_size // (1024 * 1024)} MB.")
        #* ImageField je sliku već proverio kroz Pillow i sačuvao je u value.image
        if value.image.format not in COMPANY_IMAGE_FORMATS:
            raise serializers.ValidationError("Dozvoljeni formati slike su JPG, PNG i WEBP.")
        width, height = value.image.size
        if max(width, height) > COMPANY_IMAGE_MAX_DIMENSION:
            raise serializers.ValidationError(
                f"Slika može imati najviše {COMPANY_IMAGE_MAX_DIMENSION} piksela po širini i visini."
            )
        return value

    @property
    def extension(self):
        return COMPANY_IMAGE_FORMATS[self.validated_data['img'].image.format]
