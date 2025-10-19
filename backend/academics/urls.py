from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SubjectViewSet, AttendanceViewSet, TimetableSlotViewSet, MarkViewSet, ExamViewSet, TeacherSubjectAssignmentViewSet

router = DefaultRouter()
router.register(r'subjects', SubjectViewSet, basename='subject')
router.register(r'attendance', AttendanceViewSet, basename='attendance')
router.register(r'timetable', TimetableSlotViewSet, basename='timetable')
router.register(r'marks', MarkViewSet, basename='marks')
router.register(r'exams', ExamViewSet, basename='exams')
router.register(r'teacher-assignments', TeacherSubjectAssignmentViewSet, basename='teacher-assignments')

urlpatterns = [
    path('', include(router.urls)),
]
