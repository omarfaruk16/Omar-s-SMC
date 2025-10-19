from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import ClassMaterial, MaterialAttachment
from .serializers import ClassMaterialSerializer, ClassMaterialCreateSerializer, MaterialAttachmentSerializer
from users.models import Teacher


class ClassMaterialViewSet(viewsets.ModelViewSet):
    """ViewSet for ClassMaterial management"""
    queryset = ClassMaterial.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ClassMaterialCreateSerializer
        return ClassMaterialSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        # Admin sees all materials
        if user.role == 'admin':
            return ClassMaterial.objects.all()
        
        # Teachers see materials from their assigned classes
        elif user.role == 'teacher':
            try:
                teacher = user.teacher_profile
                return ClassMaterial.objects.filter(
                    class_assigned__in=teacher.assigned_classes.all()
                )
            except Teacher.DoesNotExist:
                return ClassMaterial.objects.none()
        
        # Students see materials from their class
        elif user.role == 'student':
            try:
                student = user.student_profile
                if student.student_class:
                    return ClassMaterial.objects.filter(class_assigned=student.student_class)
            except:
                pass
        
        return ClassMaterial.objects.none()
    
    def create(self, request, *args, **kwargs):
        # Only teachers can create materials
        if request.user.role != 'teacher':
            return Response(
                {'error': 'Only teachers can create materials'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            teacher = request.user.teacher_profile
        except Teacher.DoesNotExist:
            return Response(
                {'error': 'Teacher profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Check if teacher is assigned to the class
        class_id = serializer.validated_data.get('class_assigned').id
        if not teacher.assigned_classes.filter(id=class_id).exists():
            return Response(
                {'error': 'You are not assigned to this class'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Save with teacher
        serializer.save(teacher=teacher)
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Only the teacher who created it can update
        if request.user.role == 'teacher':
            if instance.teacher.user != request.user:
                return Response(
                    {'error': 'You can only update your own materials'},
                    status=status.HTTP_403_FORBIDDEN
                )
        elif request.user.role != 'admin':
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Only the teacher who created it or admin can delete
        if request.user.role == 'teacher':
            if instance.teacher.user != request.user:
                return Response(
                    {'error': 'You can only delete your own materials'},
                    status=status.HTTP_403_FORBIDDEN
                )
        elif request.user.role != 'admin':
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'], url_path='add-attachment')
    def add_attachment(self, request, pk=None):
        """Add a new attachment to an existing material"""
        material = self.get_object()

        # Only the teacher who created it or admin can add attachments
        if request.user.role == 'teacher':
            if material.teacher.user != request.user:
                return Response(
                    {'error': 'You can only add attachments to your own materials'},
                    status=status.HTTP_403_FORBIDDEN
                )
        elif request.user.role != 'admin':
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = MaterialAttachmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(material=material)

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], url_path='remove-attachment/(?P<attachment_id>[^/.]+)')
    def remove_attachment(self, request, pk=None, attachment_id=None):
        """Remove an attachment from a material"""
        material = self.get_object()

        try:
            attachment = MaterialAttachment.objects.get(id=attachment_id, material=material)
        except MaterialAttachment.DoesNotExist:
            return Response({'error': 'Attachment not found'}, status=status.HTTP_404_NOT_FOUND)

        # Only the teacher who created it or admin can remove attachments
        if request.user.role == 'teacher':
            if material.teacher.user != request.user:
                return Response(
                    {'error': 'You can only remove attachments from your own materials'},
                    status=status.HTTP_403_FORBIDDEN
                )
        elif request.user.role != 'admin':
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )

        attachment.delete()
        return Response({'message': 'Attachment removed'}, status=status.HTTP_200_OK)
