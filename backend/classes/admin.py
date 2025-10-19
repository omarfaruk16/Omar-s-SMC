from django.contrib import admin
from .models import Class


@admin.register(Class)
class ClassAdmin(admin.ModelAdmin):
    list_display = ['name', 'section', 'get_student_count', 'get_teacher_count']
    list_filter = ['name']
    search_fields = ['name', 'section']
    ordering = ['name', 'section']
    
    def get_student_count(self, obj):
        return obj.students.count()
    get_student_count.short_description = 'Students'
    
    def get_teacher_count(self, obj):
        return obj.teachers.count()
    get_teacher_count.short_description = 'Teachers'
