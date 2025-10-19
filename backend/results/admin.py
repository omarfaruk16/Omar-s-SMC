from django.contrib import admin
from .models import Result


@admin.register(Result)
class ResultAdmin(admin.ModelAdmin):
    list_display = ['title', 'published_date', 'is_active']
    list_filter = ['is_active', 'published_date']
    search_fields = ['title']
    ordering = ['-published_date']
    date_hierarchy = 'published_date'
