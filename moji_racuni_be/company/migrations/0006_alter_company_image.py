# Generated by Django 4.1.2 on 2022-11-23 16:45

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('company', '0005_company_image'),
    ]

    operations = [
        migrations.AlterField(
            model_name='company',
            name='image',
            field=models.ImageField(default=None, null=True, upload_to=None),
        ),
    ]