# Generated by Django 4.1.2 on 2022-11-30 23:03

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('company', '0008_alter_company_image'),
    ]

    operations = [
        migrations.AlterField(
            model_name='company',
            name='type',
            field=models.ForeignKey(db_column='type', null=True, on_delete=django.db.models.deletion.SET_NULL, to='company.companytype'),
        ),
        migrations.AlterField(
            model_name='companytype',
            name='user',
            field=models.ForeignKey(db_column='user', on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name='companyunit',
            name='company',
            field=models.ForeignKey(db_column='company', null=True, on_delete=django.db.models.deletion.SET_NULL, to='company.company'),
        ),
    ]
