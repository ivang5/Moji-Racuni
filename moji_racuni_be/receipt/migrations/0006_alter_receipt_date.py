# Generated by Django 4.1.2 on 2022-11-18 19:50

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('receipt', '0005_receipt_totalvat'),
    ]

    operations = [
        migrations.AlterField(
            model_name='receipt',
            name='date',
            field=models.DateTimeField(),
        ),
    ]
