from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='order',
            name='shipping_address',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AlterField(
            model_name='order',
            name='shipping_city',
            field=models.CharField(max_length=100, blank=True, default=''),
        ),
        migrations.AlterField(
            model_name='order',
            name='shipping_state',
            field=models.CharField(max_length=100, blank=True, default=''),
        ),
        migrations.AlterField(
            model_name='order',
            name='shipping_zip',
            field=models.CharField(max_length=20, blank=True, default=''),
        ),
        migrations.AlterField(
            model_name='order',
            name='shipping_phone',
            field=models.CharField(max_length=20, blank=True, default=''),
        ),
    ]