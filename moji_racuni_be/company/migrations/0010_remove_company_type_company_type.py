# Generated by Django 4.1.2 on 2023-01-12 14:12

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('company', '0009_alter_company_type_alter_companytype_user_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='company',
            name='type',
        ),
        migrations.AddField(
            model_name='company',
            name='type',
            field=models.ManyToManyField(to='company.companytype'),
        ),
    ]
