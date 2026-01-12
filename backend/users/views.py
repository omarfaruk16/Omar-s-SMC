import hashlib
import secrets
import uuid
from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.urls import reverse
from admissions.models import AdmissionFormTemplate
from admissions.services import build_registration_download_token
from .models import Teacher, Student, PasswordResetOTP
from .serializers import (
    TeacherSerializer, StudentSerializer,
    TeacherRegistrationSerializer, StudentRegistrationSerializer,
    PublicTeacherSerializer, UserProfileSerializer,
    ChangePasswordSerializer, ForgotPasswordSerializer,
    VerifyOTPSerializer, ResetPasswordSerializer
)

User = get_user_model()


class RegisterTeacherView(generics.CreateAPIView):
    """Teacher registration endpoint"""
    queryset = Teacher.objects.all()
    serializer_class = TeacherRegistrationSerializer
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        teacher = serializer.save()
        
        return Response({
            'message': 'Teacher registration successful. Please wait for admin approval.',
            'teacher_id': teacher.teacher_id,
            'status': 'pending'
        }, status=status.HTTP_201_CREATED)


class RegisterStudentView(generics.CreateAPIView):
    """Student registration endpoint"""
    queryset = Student.objects.all()
    serializer_class = StudentRegistrationSerializer
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        student = serializer.save()

        download_url = None
        download_token = None
        template_data = None
        template = AdmissionFormTemplate.get_default()
        if template:
            download_token = build_registration_download_token(student)
            download_url = request.build_absolute_uri(
                f"{reverse('admission-registration-download')}?token={download_token}"
            )
            template_data = {
                'slug': template.slug,
                'name': template.name,
                'blank_form_url': request.build_absolute_uri(
                    reverse('admission-form-template-blank', args=[template.slug])
                ),
            }

        return Response({
            'message': 'Student registration successful. Please wait for admin approval.',
            'student_id': student.id,
            'status': 'pending',
            'admission_form': {
                'download_url': download_url,
                'download_token': download_token,
                'template': template_data,
            } if template else None,
        }, status=status.HTTP_201_CREATED)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """Get and update user profile"""
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        return self.request.user
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response({
            'message': 'Profile updated successfully',
            'user': serializer.data
        })


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'user': request.user})
        serializer.is_valid(raise_exception=True)

        user = request.user
        current_password = serializer.validated_data['current_password']
        if not user.check_password(current_password):
            return Response({'current_password': 'Current password is incorrect.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(serializer.validated_data['new_password'])
        user.save()

        return Response({'message': 'Password updated successfully.'})


def _hash_otp(code: str) -> str:
    data = f"{code}{settings.SECRET_KEY}".encode('utf-8')
    return hashlib.sha256(data).hexdigest()


def _generate_otp() -> str:
    length = getattr(settings, 'OTP_LENGTH', 6)
    length = max(4, min(int(length), 8))
    return ''.join(secrets.choice('0123456789') for _ in range(length))


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email'].strip().lower()
        user = User.objects.filter(email__iexact=email).first()

        if user:
            PasswordResetOTP.objects.filter(user=user, is_used=False).update(is_used=True)

            otp_code = _generate_otp()
            expiry_minutes = getattr(settings, 'OTP_EXPIRY_MINUTES', 10)
            expires_at = timezone.now() + timedelta(minutes=int(expiry_minutes))

            PasswordResetOTP.objects.create(
                user=user,
                code_hash=_hash_otp(otp_code),
                expires_at=expires_at,
            )

            send_mail(
                subject='Your password reset OTP',
                message=(
                    f"Your OTP is {otp_code}. "
                    f"It will expire in {expiry_minutes} minutes."
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True,
            )

        return Response({'message': 'If an account exists, an OTP has been sent.'})


class VerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email'].strip().lower()
        otp = serializer.validated_data['otp'].strip()
        user = User.objects.filter(email__iexact=email).first()

        if not user:
            return Response({'error': 'Invalid OTP.'}, status=status.HTTP_400_BAD_REQUEST)

        otp_record = PasswordResetOTP.objects.filter(user=user, is_used=False).first()
        if not otp_record or otp_record.expires_at <= timezone.now():
            return Response({'error': 'OTP expired or invalid.'}, status=status.HTTP_400_BAD_REQUEST)

        max_attempts = getattr(settings, 'OTP_MAX_ATTEMPTS', 5)
        if otp_record.attempts >= int(max_attempts):
            otp_record.is_used = True
            otp_record.save(update_fields=['is_used'])
            return Response({'error': 'OTP expired or invalid.'}, status=status.HTTP_400_BAD_REQUEST)

        if _hash_otp(otp) != otp_record.code_hash:
            otp_record.attempts += 1
            otp_record.save(update_fields=['attempts'])
            return Response({'error': 'Invalid OTP.'}, status=status.HTTP_400_BAD_REQUEST)

        otp_record.verified_at = timezone.now()
        otp_record.reset_token = uuid.uuid4()
        otp_record.save(update_fields=['verified_at', 'reset_token'])

        return Response({
            'message': 'OTP verified.',
            'reset_token': otp_record.reset_token,
        })


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = (request.data.get('email') or '').strip().lower()
        user = User.objects.filter(email__iexact=email).first()

        if not user:
            return Response({'error': 'Reset failed.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = ResetPasswordSerializer(
            data=request.data,
            context={'user': user},
        )
        serializer.is_valid(raise_exception=True)

        reset_token = serializer.validated_data['reset_token']
        otp_record = PasswordResetOTP.objects.filter(
            user=user,
            reset_token=reset_token,
            is_used=False,
        ).first()

        if not otp_record or otp_record.expires_at <= timezone.now() or not otp_record.verified_at:
            return Response({'error': 'Reset failed.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(serializer.validated_data['new_password'])
        user.save()

        otp_record.is_used = True
        otp_record.save(update_fields=['is_used'])

        return Response({'message': 'Password reset successfully.'})


class TeacherViewSet(viewsets.ModelViewSet):
    """ViewSet for Teacher management"""
    queryset = Teacher.objects.all()
    serializer_class = TeacherSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Teacher.objects.all()
        elif user.role == 'teacher':
            return Teacher.objects.filter(user=user)
        return Teacher.objects.none()

    def destroy(self, request, *args, **kwargs):
        # Only admin can delete teacher profiles
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get all pending teachers (admin only)"""
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        pending_teachers = Teacher.objects.filter(user__status='pending')
        serializer = self.get_serializer(pending_teachers, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a teacher (admin only)"""
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        teacher = self.get_object()
        teacher.user.status = 'approved'
        teacher.user.save()
        
        return Response({'message': 'Teacher approved successfully'})
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a teacher (admin only)"""
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        teacher = self.get_object()
        teacher.user.status = 'rejected'
        teacher.user.save()
        
        return Response({'message': 'Teacher rejected'})
    
    @action(detail=True, methods=['post'])
    def assign_classes(self, request, pk=None):
        """Assign classes to teacher (admin only)"""
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        teacher = self.get_object()
        class_ids = request.data.get('class_ids', [])
        
        from classes.models import Class
        classes = Class.objects.filter(id__in=class_ids)
        teacher.assigned_classes.set(classes)
        
        serializer = self.get_serializer(teacher)
        return Response({
            'message': 'Classes assigned successfully',
            'teacher': serializer.data
        })


class StudentViewSet(viewsets.ModelViewSet):
    """ViewSet for Student management"""
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Student.objects.all()
        elif user.role == 'student':
            return Student.objects.filter(user=user)
        return Student.objects.none()

    def destroy(self, request, *args, **kwargs):
        # Only admin can delete student profiles
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get all pending students (admin only)"""
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        pending_students = Student.objects.filter(user__status='pending')
        serializer = self.get_serializer(pending_students, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a student (admin only)"""
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        student = self.get_object()
        student.user.status = 'approved'
        student.user.save()
        return Response({'message': 'Student approved successfully'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a student (admin only)"""
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        student = self.get_object()
        student.user.status = 'rejected'
        student.user.save()
        return Response({'message': 'Student rejected'})

    @action(detail=True, methods=['post'])
    def change_class(self, request, pk=None):
        """Change student class (admin only)"""
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        student = self.get_object()
        class_id = request.data.get('class_id')
        from classes.models import Class
        try:
            student_class = Class.objects.get(id=class_id)
            student.student_class = student_class
            student.save()
            serializer = self.get_serializer(student)
            return Response({'message': 'Student class changed successfully', 'student': serializer.data})
        except Class.DoesNotExist:
            return Response({'error': 'Class not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'], url_path='by_class')
    def by_class(self, request):
        """List students of a class. Admin: any class. Teacher: only assigned classes."""
        class_id = request.query_params.get('class_id')
        if not class_id:
            return Response({'error': 'class_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        from classes.models import Class
        try:
            clazz = Class.objects.get(id=class_id)
        except Class.DoesNotExist:
            return Response({'error': 'Class not found'}, status=status.HTTP_404_NOT_FOUND)
        user = request.user
        if user.role == 'admin':
            queryset = Student.objects.filter(student_class=clazz)
        elif user.role == 'teacher':
            try:
                teacher = user.teacher_profile
            except:
                return Response({'error': 'Teacher profile not found'}, status=status.HTTP_404_NOT_FOUND)
            if not teacher.assigned_classes.filter(id=class_id).exists():
                return Response({'error': 'Not assigned to this class'}, status=status.HTTP_403_FORBIDDEN)
            queryset = Student.objects.filter(student_class=clazz)
        else:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class PublicTeacherList(generics.ListAPIView):
    """Public, read-only list of approved teachers (no sensitive data)."""
    serializer_class = PublicTeacherSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Teacher.objects.filter(user__status='approved').order_by('user__first_name', 'user__last_name')

    @action(detail=False, methods=['get'], url_path='by_class')
    def by_class(self, request):
        """List students of a class. Admin: any class. Teacher: only assigned classes."""
        class_id = request.query_params.get('class_id')
        if not class_id:
            return Response({'error': 'class_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        from classes.models import Class
        try:
            clazz = Class.objects.get(id=class_id)
        except Class.DoesNotExist:
            return Response({'error': 'Class not found'}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        if user.role == 'admin':
            queryset = Student.objects.filter(student_class=clazz)
        elif user.role == 'teacher':
            try:
                teacher = user.teacher_profile
            except:
                return Response({'error': 'Teacher profile not found'}, status=status.HTTP_404_NOT_FOUND)
            if not teacher.assigned_classes.filter(id=class_id).exists():
                return Response({'error': 'Not assigned to this class'}, status=status.HTTP_403_FORBIDDEN)
            queryset = Student.objects.filter(student_class=clazz)
        else:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
