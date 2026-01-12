from django.db import models
from django.utils import timezone


class PushSubscription(models.Model):
    teacher = models.ForeignKey(
        'users.Teacher',
        on_delete=models.CASCADE,
        related_name='push_subscriptions',
    )
    endpoint = models.URLField(unique=True)
    p256dh = models.CharField(max_length=255)
    auth = models.CharField(max_length=255)
    user_agent = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=True)
    last_seen = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self) -> str:
        return f"{self.teacher} - {self.endpoint[:48]}"


class NotificationLog(models.Model):
    STATUS_CHOICES = (
        ('sent', 'Sent'),
        ('failed', 'Failed'),
    )

    teacher = models.ForeignKey(
        'users.Teacher',
        on_delete=models.CASCADE,
        related_name='notification_logs',
    )
    timetable_slot = models.ForeignKey(
        'academics.TimetableSlot',
        on_delete=models.CASCADE,
        related_name='notification_logs',
    )
    scheduled_for = models.DateTimeField()
    sent_at = models.DateTimeField(default=timezone.now)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='sent')
    payload = models.JSONField(blank=True, null=True)
    error = models.TextField(blank=True)

    class Meta:
        ordering = ['-sent_at']
        unique_together = ['teacher', 'timetable_slot', 'scheduled_for']

    def __str__(self) -> str:
        return f"{self.teacher} - {self.timetable_slot} - {self.scheduled_for}"
