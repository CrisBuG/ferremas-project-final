# Generated by Django 5.2.1 on 2025-06-07 07:58

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0002_alter_shipping_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='payment_token',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
    ]
