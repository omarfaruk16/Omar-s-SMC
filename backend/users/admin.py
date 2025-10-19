from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Teacher, Student


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'username', 'role', 'status', 'first_name', 'last_name', 'is_staff']
    list_filter = ['role', 'status', 'is_staff', 'is_superuser']
    search_fields = ['email', 'username', 'first_name', 'last_name', 'phone']
    ordering = ['-date_joined']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('phone', 'role', 'status', 'image')}),
    )
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Additional Info', {'fields': ('email', 'phone', 'role', 'status', 'image')}),
    )


@admin.register(Teacher)
class TeacherAdmin(admin.ModelAdmin):
    list_display = ['user', 'nid', 'get_assigned_classes']
    list_filter = ['assigned_classes']
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'nid']
    filter_horizontal = ['assigned_classes']
    
    def get_assigned_classes(self, obj):
        return ", ".join([str(c) for c in obj.assigned_classes.all()])
    get_assigned_classes.short_description = 'Assigned Classes'


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ['user', 'student_class']
    list_filter = ['student_class']
    search_fields = ['user__email', 'user__first_name', 'user__last_name']
