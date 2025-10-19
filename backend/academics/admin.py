from django.contrib import admin
from .models import Subject, AttendanceRecord, TimetableSlot, Mark, Exam


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'class_count']
    search_fields = ['name', 'code']
    filter_horizontal = ['classes']

    def class_count(self, obj):
        return obj.classes.count()


@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    list_display = ['date', 'student', 'class_assigned', 'status', 'marked_by']
    list_filter = ['date', 'status', 'class_assigned']
    search_fields = ['student__user__first_name', 'student__user__last_name']
    date_hierarchy = 'date'


@admin.register(TimetableSlot)
class TimetableSlotAdmin(admin.ModelAdmin):
    list_display = ['class_assigned', 'weekday', 'start_time', 'end_time', 'subject', 'teacher']
    list_filter = ['class_assigned', 'weekday', 'subject']
    search_fields = ['class_assigned__name', 'teacher__user__first_name', 'teacher__user__last_name']

@admin.register(Mark)
class MarkAdmin(admin.ModelAdmin):
    list_display = ['student', 'class_assigned', 'subject', 'exam_name', 'score', 'max_score', 'date']
    list_filter = ['class_assigned', 'subject', 'date']
    search_fields = ['student__user__first_name', 'student__user__last_name', 'exam_name']

@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    list_display = ['title', 'class_assigned', 'subject', 'date', 'start_time', 'end_time']
    list_filter = ['class_assigned', 'subject', 'date']
    search_fields = ['title', 'description']
