from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('transcripts', '0001_initial'),
    ]

    operations = [
        migrations.RenameModel(
            old_name='TranscriptPayment',
            new_name='TestimonialPayment',
        ),
        migrations.RenameModel(
            old_name='TranscriptRequest',
            new_name='TestimonialRequest',
        ),
        migrations.AlterField(
            model_name='testimonialpayment',
            name='student',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='testimonial_payments', to='users.student'),
        ),
        migrations.AlterField(
            model_name='testimonialrequest',
            name='payment',
            field=models.OneToOneField(on_delete=django.db.models.deletion.PROTECT, related_name='testimonial_request', to='transcripts.testimonialpayment'),
        ),
        migrations.AlterField(
            model_name='testimonialrequest',
            name='student',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='testimonial_requests', to='users.student'),
        ),
        migrations.RemoveField(
            model_name='testimonialrequest',
            name='reviewed_at',
        ),
        migrations.RemoveField(
            model_name='testimonialrequest',
            name='notes',
        ),
        migrations.AlterField(
            model_name='testimonialrequest',
            name='status',
            field=models.CharField(choices=[('pending', 'Pending'), ('paid', 'Paid'), ('failed', 'Failed')], default='pending', max_length=10),
        ),
    ]
