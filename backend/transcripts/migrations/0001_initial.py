from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('users', '0006_password_reset_otp'),
    ]

    operations = [
        migrations.CreateModel(
            name='TranscriptPayment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('amount', models.DecimalField(decimal_places=2, max_digits=10)),
                ('transaction_id', models.CharField(max_length=64, unique=True)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('paid', 'Paid'), ('failed', 'Failed')], default='pending', max_length=10)),
                ('gateway_payload', models.JSONField(blank=True, null=True)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('paid_at', models.DateTimeField(blank=True, null=True)),
                ('student', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='transcript_payments', to='users.student')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='TranscriptRequest',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('status', models.CharField(choices=[('pending_review', 'Pending Review'), ('approved', 'Approved'), ('rejected', 'Rejected')], default='pending_review', max_length=20)),
                ('requested_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('reviewed_at', models.DateTimeField(blank=True, null=True)),
                ('notes', models.TextField(blank=True, null=True)),
                ('payment', models.OneToOneField(on_delete=django.db.models.deletion.PROTECT, related_name='request', to='transcripts.transcriptpayment')),
                ('student', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='transcript_requests', to='users.student')),
            ],
            options={
                'ordering': ['-requested_at'],
            },
        ),
    ]
