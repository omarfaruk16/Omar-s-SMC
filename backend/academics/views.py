from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Subject, AttendanceRecord, TimetableSlot, Mark, Exam, TeacherSubjectAssignment
from .serializers import SubjectSerializer, AttendanceRecordSerializer, TimetableSlotSerializer, MarkSerializer, ExamSerializer, TeacherSubjectAssignmentSerializer
from django.db import models
from django.http import HttpResponse
from .services import generate_exam_admit_card_pdf


class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)


class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = AttendanceRecord.objects.all()
    serializer_class = AttendanceRecordSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = AttendanceRecord.objects.all()
        # Role-based base filter
        if user.role == 'admin':
            pass
        elif user.role == 'teacher':
            try:
                teacher = user.teacher_profile
                qs = qs.filter(class_assigned__in=teacher.assigned_classes.all())
            except Exception:
                return AttendanceRecord.objects.none()
        elif user.role == 'student':
            try:
                student = user.student_profile
                qs = qs.filter(student=student)
            except Exception:
                return AttendanceRecord.objects.none()
        else:
            return AttendanceRecord.objects.none()

        # Optional filters
        class_id = self.request.query_params.get('class_id')
        if class_id:
            qs = qs.filter(class_assigned_id=class_id)
        subject_id = self.request.query_params.get('subject_id')
        if subject_id:
            qs = qs.filter(subject_id=subject_id)
        student_id = self.request.query_params.get('student_id')
        if student_id:
            qs = qs.filter(student_id=student_id)
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            qs = qs.filter(date__gte=date_from)
        if date_to:
            qs = qs.filter(date__lte=date_to)
        return qs

    @action(detail=False, methods=['post'])
    def mark(self, request):
        """Mark attendance for a class and date. Teachers/Admin only.
        Payload: { class_id: int, date: 'YYYY-MM-DD', present_ids: [student_id,...] }
        """
        user = request.user
        if user.role not in ['teacher', 'admin']:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        class_id = request.data.get('class_id')
        date = request.data.get('date')
        present_ids = set(request.data.get('present_ids', []))
        subject_id = request.data.get('subject_id')
        if not class_id or not date:
            return Response({'error': 'class_id and date are required'}, status=status.HTTP_400_BAD_REQUEST)

        from users.models import Student, Teacher
        from classes.models import Class
        try:
            clazz = Class.objects.get(id=class_id)
        except Class.DoesNotExist:
            return Response({'error': 'Class not found'}, status=status.HTTP_404_NOT_FOUND)

        # Teacher can only mark for assigned classes
        if user.role == 'teacher':
            try:
                teacher = user.teacher_profile
            except Teacher.DoesNotExist:
                return Response({'error': 'Teacher profile not found'}, status=status.HTTP_404_NOT_FOUND)
            if not teacher.assigned_classes.filter(id=class_id).exists():
                return Response({'error': 'Not assigned to this class'}, status=status.HTTP_403_FORBIDDEN)

        students = Student.objects.filter(student_class=clazz)
        # Create/update records
        marked_by = user.teacher_profile if user.role == 'teacher' else None
        created = updated = 0
        for s in students:
            status_value = 'present' if s.id in present_ids else 'absent'
            obj, created_flag = AttendanceRecord.objects.update_or_create(
                date=date, student=s,
                defaults={'class_assigned': clazz, 'subject_id': subject_id, 'status': status_value, 'marked_by': marked_by}
            )
            if created_flag:
                created += 1
            else:
                updated += 1
        return Response({'message': 'Attendance saved', 'created': created, 'updated': updated})


class TimetableSlotViewSet(viewsets.ModelViewSet):
    queryset = TimetableSlot.objects.all()
    serializer_class = TimetableSlotSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = TimetableSlot.objects.all()
        if user.role == 'admin':
            return qs
        elif user.role == 'teacher':
            try:
                teacher = user.teacher_profile
                return qs.filter(teacher=teacher) | qs.filter(class_assigned__in=teacher.assigned_classes.all())
            except:
                return TimetableSlot.objects.none()
        elif user.role == 'student':
            try:
                student = user.student_profile
                if student.student_class:
                    return qs.filter(class_assigned=student.student_class)
            except:
                pass
        return TimetableSlot.objects.none()

    def create(self, request, *args, **kwargs):
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)


class MarkViewSet(viewsets.ModelViewSet):
    queryset = Mark.objects.all()
    serializer_class = MarkSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Mark.objects.all()
        if user.role == 'admin':
            return qs
        elif user.role == 'teacher':
            try:
                teacher = user.teacher_profile
                return qs.filter(class_assigned__in=teacher.assigned_classes.all())
            except:
                return Mark.objects.none()
        elif user.role == 'student':
            try:
                student = user.student_profile
                return qs.filter(student=student, published=True)
            except:
                return Mark.objects.none()
        return Mark.objects.none()

    def create(self, request, *args, **kwargs):
        if request.user.role != 'teacher':
            return Response({'error': 'Only teachers can create marks'}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if request.user.role not in ['teacher','admin']:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if request.user.role not in ['teacher','admin']:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        mark = self.get_object()
        mark.published = True
        mark.save()
        return Response({'message': 'Mark published'})


class ExamViewSet(viewsets.ModelViewSet):
    queryset = Exam.objects.all()
    serializer_class = ExamSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Exam.objects.all()
        if user.role == 'admin':
            return qs
        elif user.role == 'teacher':
            try:
                teacher = user.teacher_profile
                return qs.filter(models.Q(class_assigned__in=teacher.assigned_classes.all()) | models.Q(invigilator=teacher)).distinct()
            except:
                return Exam.objects.none()
        elif user.role == 'student':
            try:
                student = user.student_profile
                if student.student_class:
                    qs = qs.filter(class_assigned=student.student_class, published=True)
                else:
                    return Exam.objects.none()
            except:
                return Exam.objects.none()
        else:
            return Exam.objects.none()
        # Optional filters by date range
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            qs = qs.filter(date__gte=date_from)
        if date_to:
            qs = qs.filter(date__lte=date_to)
        return qs

    def create(self, request, *args, **kwargs):
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        exam = self.get_object()
        exam.published = True
        exam.save()
        return Response({'message': 'Exam published'})

    @action(detail=True, methods=['post'])
    def unpublish(self, request, pk=None):
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        exam = self.get_object()
        exam.published = False
        exam.save()
        return Response({'message': 'Exam unpublished'})

    @action(detail=False, methods=['get'], url_path='admit-card')
    def admit_card(self, request):
        if request.user.role != 'student':
            return Response({'error': 'Student access required'}, status=status.HTTP_403_FORBIDDEN)

        exam_title = request.query_params.get('exam_title')
        class_id = request.query_params.get('class_id')
        if not exam_title or not class_id:
            return Response({'error': 'exam_title and class_id are required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            student = request.user.student_profile
        except Exception:
            return Response({'error': 'Student profile not found'}, status=status.HTTP_404_NOT_FOUND)

        if str(student.student_class_id) != str(class_id):
            return Response({'error': 'Not allowed for this class'}, status=status.HTTP_403_FORBIDDEN)

        exams = Exam.objects.filter(title=exam_title, class_assigned_id=class_id, published=True).order_by('date', 'start_time')
        if not exams.exists():
            return Response({'error': 'No published exams found'}, status=status.HTTP_404_NOT_FOUND)

        filename, pdf_bytes = generate_exam_admit_card_pdf(student, exam_title, exams)
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename=\"{filename}\"'
        response['Content-Length'] = len(pdf_bytes)
        return response


class TeacherSubjectAssignmentViewSet(viewsets.ModelViewSet):
    """ViewSet for managing teacher-subject-class assignments"""
    queryset = TeacherSubjectAssignment.objects.all()
    serializer_class = TeacherSubjectAssignmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = TeacherSubjectAssignment.objects.all()

        # Filter by query params
        teacher_id = self.request.query_params.get('teacher_id')
        if teacher_id:
            qs = qs.filter(teacher_id=teacher_id)

        class_id = self.request.query_params.get('class_id')
        if class_id:
            qs = qs.filter(class_assigned_id=class_id)

        subject_id = self.request.query_params.get('subject_id')
        if subject_id:
            qs = qs.filter(subject_id=subject_id)

        # Role-based filtering
        if user.role == 'admin':
            return qs
        elif user.role == 'teacher':
            try:
                teacher = user.teacher_profile
                return qs.filter(teacher=teacher)
            except:
                return TeacherSubjectAssignment.objects.none()
        else:
            # Students can view to see which teacher teaches which subject
            return qs

    def create(self, request, *args, **kwargs):
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=['post'], url_path='bulk-assign')
    def bulk_assign(self, request):
        """Bulk assign a teacher to multiple subject-class combinations
        Payload: { teacher_id: int, assignments: [{subject_id: int, class_id: int}, ...] }
        """
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)

        teacher_id = request.data.get('teacher_id')
        assignments = request.data.get('assignments', [])

        if not teacher_id or not assignments:
            return Response({'error': 'teacher_id and assignments are required'}, status=status.HTTP_400_BAD_REQUEST)

        from users.models import Teacher
        try:
            teacher = Teacher.objects.get(id=teacher_id)
        except Teacher.DoesNotExist:
            return Response({'error': 'Teacher not found'}, status=status.HTTP_404_NOT_FOUND)

        created_count = 0
        errors = []

        for assignment in assignments:
            subject_id = assignment.get('subject_id')
            class_id = assignment.get('class_id')

            if not subject_id or not class_id:
                errors.append(f"Missing subject_id or class_id in assignment: {assignment}")
                continue

            try:
                obj, created = TeacherSubjectAssignment.objects.get_or_create(
                    teacher=teacher,
                    subject_id=subject_id,
                    class_assigned_id=class_id
                )
                if created:
                    created_count += 1
            except Exception as e:
                errors.append(f"Error creating assignment {assignment}: {str(e)}")

        return Response({
            'message': f'{created_count} assignments created',
            'created': created_count,
            'errors': errors
        })
