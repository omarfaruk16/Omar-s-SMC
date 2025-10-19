from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterTeacherView, RegisterStudentView, UserProfileView,
    TeacherViewSet, StudentViewSet
)

router = DefaultRouter()
router.register(r'teachers', TeacherViewSet, basename='teacher')
router.register(r'students', StudentViewSet, basename='student')

urlpatterns = [
    path('register/teacher/', RegisterTeacherView.as_view(), name='register-teacher'),
    path('register/student/', RegisterStudentView.as_view(), name='register-student'),
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    # Explicit route for listing students by class for teachers/admin
    path('students/by_class/', StudentViewSet.as_view({'get': 'by_class'}), name='students-by-class'),
    path('', include(router.urls)),
]
