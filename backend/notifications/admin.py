from django.contrib import admin

from .models import PushSubscription, NotificationLog


@admin.register(PushSubscription)
class PushSubscriptionAdmin(admin.ModelAdmin):
    list_display = ['teacher', 'endpoint', 'is_active', 'last_seen', 'updated_at']
    list_filter = ['is_active', 'last_seen', 'updated_at']
    search_fields = ['teacher__user__first_name', 'teacher__user__last_name', 'endpoint']
    ordering = ['-updated_at']


@admin.register(NotificationLog)
class NotificationLogAdmin(admin.ModelAdmin):
    list_display = ['teacher', 'timetable_slot', 'scheduled_for', 'status', 'sent_at']
    list_filter = ['status', 'scheduled_for', 'sent_at']
    search_fields = ['teacher__user__first_name', 'teacher__user__last_name']
    ordering = ['-sent_at']
