# Generated by Django 4.1.2 on 2023-01-12 14:34

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('company', '0010_remove_company_type_company_type'),
    ]

    operations = [
        migrations.AlterField(
            model_name='company',
            name='type',
            field=models.ManyToManyField(null=True, to='company.companytype'),
        ),
    ]
