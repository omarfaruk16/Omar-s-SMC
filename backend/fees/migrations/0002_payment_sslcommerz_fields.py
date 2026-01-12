from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('fees', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='payment',
            name='gateway_payload',
            field=models.JSONField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='payment',
            name='method',
            field=models.CharField(choices=[('bkash', 'bKash'), ('nagad', 'Nagad'), ('rocket', 'Rocket'), ('cash', 'Cash'), ('sslcommerz', 'SSLCommerz')], max_length=10),
        ),
    ]
