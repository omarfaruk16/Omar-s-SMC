from django.contrib import admin
from .models import TestimonialPayment, TestimonialRequest, TestimonialDetails


@admin.register(TestimonialPayment)
class TestimonialPaymentAdmin(admin.ModelAdmin):
    list_display = ['id', 'student', 'amount', 'status', 'transaction_id', 'created_at', 'paid_at']
    list_filter = ['status', 'created_at']
    search_fields = ['student__user__email', 'student__user__first_name', 'student__user__last_name', 'transaction_id']
    readonly_fields = ['created_at', 'paid_at']
    date_hierarchy = 'created_at'


@admin.register(TestimonialRequest)
class TestimonialRequestAdmin(admin.ModelAdmin):
    list_display = ['id', 'student', 'status', 'payment', 'requested_at', 'processed_at']
    list_filter = ['status', 'requested_at', 'processed_at']
    search_fields = ['student__user__email', 'student__user__first_name', 'student__user__last_name']
    readonly_fields = ['requested_at', 'processed_at']
    date_hierarchy = 'requested_at'


@admin.register(TestimonialDetails)
class TestimonialDetailsAdmin(admin.ModelAdmin):
    list_display = ['id', 'testimonial_request', 'serial_number', 'bangla_name', 'name', 'gpa', 'created_at']
    list_filter = ['created_at', 'gpa']
    search_fields = ['bangla_name', 'name', 'serial_number', 'testimonial_request__student__user__email']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'created_at'
