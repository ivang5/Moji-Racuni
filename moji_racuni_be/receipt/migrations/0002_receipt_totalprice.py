# Generated by Django 4.1.2 on 2022-11-04 14:11

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('receipt', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='receipt',
            name='totalPrice',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=9),
            preserve_default=False,
        ),
    ]