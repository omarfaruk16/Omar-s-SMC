from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Teacher, Student


class StudentInline(admin.StackedInline):
    model = Student
    can_delete = False
    verbose_name_plural = 'Student Profile'
    fk_name = 'user'
    extra = 0


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'username', 'role', 'status', 'first_name', 'last_name', 'is_staff']
    list_filter = ['role', 'status', 'is_staff', 'is_superuser']
    search_fields = ['email', 'username', 'first_name', 'last_name', 'phone']
    ordering = ['-date_joined']
    inlines = (StudentInline,)
    
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
    list_display = ['user', 'roll_number', 'student_class', 'session']
    list_filter = ['student_class', 'session']
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'roll_number']
    ordering = ['user__first_name']
    fields = (
        'user', 'student_class', 'roll_number', 'session', 'registration',
        'bangla_name', 'date_of_birth', 'gender', 'religion', 'blood_group', 'nationality',
        'address', 'permanent_address', 'village', 'post_office', 'post_code', 'upazilla_thana', 'district',
        'fathers_name', 'fathers_nid', 'fathers_occupation', 'mothers_name', 'mothers_nid', 'mothers_occupation',
        'guardian_name', 'guardian_phone', 'guardian_monthly_income',
        'ssc_board', 'ssc_registration_no', 'ssc_group', 'ssc_roll_number', 'ssc_year_of_passing', 'ssc_gpa',
        'first_subject', 'second_subject', 'third_subject', 'fourth_subject'
    )
