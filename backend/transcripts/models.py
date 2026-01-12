from django.db import models
from django.utils import timezone


class TranscriptPayment(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
    )

    student = models.ForeignKey('users.Student', on_delete=models.CASCADE, related_name='transcript_payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    transaction_id = models.CharField(max_length=64, unique=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    gateway_payload = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    paid_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.student.user.get_full_name()} - {self.amount} - {self.status}"


class TranscriptRequest(models.Model):
    STATUS_CHOICES = (
        ('pending_review', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )

    student = models.ForeignKey('users.Student', on_delete=models.CASCADE, related_name='transcript_requests')
    payment = models.OneToOneField(TranscriptPayment, on_delete=models.PROTECT, related_name='request')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending_review')
    requested_at = models.DateTimeField(default=timezone.now)
    reviewed_at = models.DateTimeField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-requested_at']

    def __str__(self):
        return f"{self.student.user.get_full_name()} - {self.status}"
