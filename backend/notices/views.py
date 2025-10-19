from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .models import Notice
from django.db import models
from .serializers import NoticeSerializer


class NoticeViewSet(viewsets.ModelViewSet):
    """ViewSet for Notice management"""
    queryset = Notice.objects.all()
    serializer_class = NoticeSerializer
    
    def get_permissions(self):
        # Allow public access to list and retrieve active notices
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        # Public users only see active notices for all audience
        user = self.request.user
        qs = Notice.objects.filter(is_active=True)
        if not user.is_authenticated:
            return qs.filter(target_role='all')

        # Admin sees all notices
        if user.role == 'admin':
            return Notice.objects.all()

        # Teachers and students see targeted + global notices
        if user.role == 'teacher':
            try:
                teacher = user.teacher_profile
                return qs.filter(
                    models.Q(target_role='all') |
                    (models.Q(target_role='teacher') & models.Q(target_classes__in=teacher.assigned_classes.all()))
                ).distinct()
            except Exception:
                return qs.filter(target_role='all')
        if user.role == 'student':
            try:
                student = user.student_profile
                if student.student_class:
                    return qs.filter(
                        models.Q(target_role='all') |
                        (models.Q(target_role='student') & models.Q(target_classes=student.student_class))
                    ).distinct()
            except Exception:
                pass
        return qs.filter(target_role='all')
    
    def create(self, request, *args, **kwargs):
        # Only admin can create notices
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required'}, status=403)
        return super().create(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        # Only admin can update notices
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required'}, status=403)
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        # Only admin can delete notices
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required'}, status=403)
        return super().destroy(request, *args, **kwargs)
