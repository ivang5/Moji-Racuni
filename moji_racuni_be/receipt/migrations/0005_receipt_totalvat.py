# Generated by Django 4.1.2 on 2022-11-16 19:22

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('receipt', '0004_alter_item_vattype'),
    ]

    operations = [
        migrations.AddField(
            model_name='receipt',
            name='totalVat',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=9),
            preserve_default=False,
        ),
    ]