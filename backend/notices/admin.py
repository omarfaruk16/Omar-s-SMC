from django.contrib import admin
from .models import Notice


@admin.register(Notice)
class NoticeAdmin(admin.ModelAdmin):
    list_display = ['title', 'created_date', 'is_active', 'target_role']
    list_filter = ['is_active', 'created_date', 'target_role']
    search_fields = ['title', 'description']
    ordering = ['-created_date']
    date_hierarchy = 'created_date'
    filter_horizontal = ['target_classes']
