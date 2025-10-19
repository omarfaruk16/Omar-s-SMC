from django.contrib import admin
from .models import Fee, Payment


@admin.register(Fee)
class FeeAdmin(admin.ModelAdmin):
    list_display = ['title', 'class_assigned', 'month', 'amount', 'status', 'created_date']
    list_filter = ['status', 'class_assigned', 'month', 'created_date']
    search_fields = ['title', 'class_assigned__name']
    ordering = ['-created_date']
    date_hierarchy = 'created_date'


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['student', 'fee', 'method', 'transaction_id', 'status', 'payment_date']
    list_filter = ['status', 'method', 'payment_date']
    search_fields = ['student__user__first_name', 'student__user__last_name', 'transaction_id']
    ordering = ['-payment_date']
    date_hierarchy = 'payment_date'
    raw_id_fields = ['student', 'fee']
    readonly_fields = ['payment_date']
