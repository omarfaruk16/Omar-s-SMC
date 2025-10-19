from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Class
from .serializers import ClassSerializer


class ClassViewSet(viewsets.ModelViewSet):
    """ViewSet for Class management"""
    queryset = Class.objects.all()
    serializer_class = ClassSerializer
    
    def get_permissions(self):
        # Allow public access to list and retrieve
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        return Class.objects.all().order_by('name', 'section')
    
    def create(self, request, *args, **kwargs):
        # Only admin can create classes
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required'}, status=403)
        return super().create(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        # Only admin can update classes
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required'}, status=403)
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        # Only admin can delete classes
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required'}, status=403)
        return super().destroy(request, *args, **kwargs)
