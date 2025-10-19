from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .models import Result
from .serializers import ResultSerializer


class ResultViewSet(viewsets.ModelViewSet):
    """ViewSet for Result management"""
    queryset = Result.objects.all()
    serializer_class = ResultSerializer
    
    def get_permissions(self):
        # Allow public access to list and retrieve active results
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        # Public users only see active results
        if not self.request.user.is_authenticated:
            return Result.objects.filter(is_active=True)
        
        # Admin sees all results
        if self.request.user.role == 'admin':
            return Result.objects.all()
        
        # Authenticated users see active results
        return Result.objects.filter(is_active=True)
    
    def create(self, request, *args, **kwargs):
        # Only admin can create results
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required'}, status=403)
        return super().create(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        # Only admin can update results
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required'}, status=403)
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        # Only admin can delete results
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required'}, status=403)
        return super().destroy(request, *args, **kwargs)
