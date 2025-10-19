from django.contrib import admin
from .models import ClassMaterial


@admin.register(ClassMaterial)
class ClassMaterialAdmin(admin.ModelAdmin):
    list_display = ['title', 'teacher', 'class_assigned', 'subject', 'uploaded_date']
    list_filter = ['class_assigned', 'subject', 'uploaded_date']
    search_fields = ['title', 'description', 'teacher__user__first_name', 'teacher__user__last_name']
    ordering = ['-uploaded_date']
    date_hierarchy = 'uploaded_date'
    raw_id_fields = ['teacher']
