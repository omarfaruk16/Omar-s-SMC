import uuid

from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Subject, AttendanceRecord, TimetableSlot, Mark, Exam, ExamSchedule, TeacherSubjectAssignment, ResultSubmission
from .serializers import SubjectSerializer, AttendanceRecordSerializer, TimetableSlotSerializer, MarkSerializer, ExamSerializer, TeacherSubjectAssignmentSerializer, ResultSubmissionSerializer
from django.db import models
from django.http import HttpResponse
from django.utils import timezone
from .services import generate_exam_admit_card_pdf, generate_exam_routine_pdf, generate_marksheet_pdf
from fees.models import Fee, Payment
from users.models import Student


class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    # Subjects are a small, bounded reference set the admin needs in full.
    # Without this, the global PAGE_SIZE=20 silently caps the list at 20 items.
    pagination_class = None

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
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
                # Filter classes where teacher has at least one subject assignment
                assigned_classes = TeacherSubjectAssignment.objects.filter(teacher=teacher).values_list('class_assigned', flat=True).distinct()
                qs = qs.filter(class_assigned__in=assigned_classes)
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

        # Teacher can only mark for assigned classes/subjects
        if user.role == 'teacher':
            try:
                teacher = user.teacher_profile
            except Teacher.DoesNotExist:
                return Response({'error': 'Teacher profile not found'}, status=status.HTTP_404_NOT_FOUND)
            if not TeacherSubjectAssignment.objects.filter(
                teacher=teacher,
                class_assigned_id=class_id,
            ).exists():
                return Response({'error': 'Not assigned to this class'}, status=status.HTTP_403_FORBIDDEN)
            if subject_id:
                assigned = TeacherSubjectAssignment.objects.filter(
                    teacher=teacher,
                    class_assigned_id=class_id,
                    subject_id=subject_id,
                ).exists()
                if not assigned:
                    return Response({'error': 'Not assigned to this subject'}, status=status.HTTP_403_FORBIDDEN)

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
            except Exception:
                return TimetableSlot.objects.none()
        elif user.role == 'student':
            try:
                student = user.student_profile
                if student.student_class:
                    return qs.filter(class_assigned=student.student_class)
            except Exception:
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
            pass
        elif user.role == 'teacher':
            try:
                teacher = user.teacher_profile
                assignments = TeacherSubjectAssignment.objects.filter(teacher=teacher)
                class_ids = assignments.values_list('class_assigned_id', flat=True)
                subject_ids = assignments.values_list('subject_id', flat=True)
                qs = qs.filter(class_assigned_id__in=class_ids, subject_id__in=subject_ids)
            except Exception:
                return Mark.objects.none()
        elif user.role == 'student':
            try:
                student = user.student_profile
                qs = qs.filter(student=student, published=True)
            except Exception:
                return Mark.objects.none()
        exam_id = self.request.query_params.get('exam_id')
        if exam_id:
            qs = qs.filter(exam_id=exam_id)
        subject_id = self.request.query_params.get('subject_id')
        if subject_id:
            qs = qs.filter(subject_id=subject_id)
        class_id = self.request.query_params.get('class_id')
        if class_id:
            qs = qs.filter(class_assigned_id=class_id)
        return qs

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

    @action(detail=False, methods=['get'], url_path='marksheet')
    def marksheet(self, request):
        if request.user.role != 'student':
            return Response({'error': 'Student access required'}, status=status.HTTP_403_FORBIDDEN)

        exam_id = request.query_params.get('exam_id')
        batch_id = request.query_params.get('batch_id')
        if not exam_id and not batch_id:
            return Response({'error': 'exam_id or batch_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            student = request.user.student_profile
        except Exception:
            return Response({'error': 'Student profile not found'}, status=status.HTTP_404_NOT_FOUND)

        class_name = str(student.student_class) if student.student_class else "-"
        exam_title = "Marksheet"
        marks_qs = Mark.objects.filter(student=student, published=True)

        if exam_id:
            marks_qs = marks_qs.filter(exam_id=exam_id)
            exam = Exam.objects.filter(id=exam_id).first()
            if exam and exam.title:
                exam_title = exam.title
        else:
            exams = Exam.objects.filter(batch_id=batch_id, class_assigned=student.student_class)
            if not exams.exists():
                return Response({'error': 'No exams found'}, status=status.HTTP_404_NOT_FOUND)
            marks_qs = marks_qs.filter(exam__in=exams)
            exam_title = exams.first().title or "Marksheet"

        if not marks_qs.exists():
            return Response({'error': 'No published results found'}, status=status.HTTP_404_NOT_FOUND)

        filename, pdf_bytes = generate_marksheet_pdf(student, exam_title, class_name, marks_qs)
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        response['Content-Length'] = len(pdf_bytes)
        return response


class ResultSubmissionViewSet(viewsets.ModelViewSet):
    queryset = ResultSubmission.objects.all()
    serializer_class = ResultSubmissionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = ResultSubmission.objects.all()
        if user.role == 'admin':
            pass
        elif user.role == 'teacher':
            try:
                teacher = user.teacher_profile
                qs = qs.filter(teacher=teacher)
            except Exception:
                return ResultSubmission.objects.none()
        else:
            return ResultSubmission.objects.none()

        exam_id = self.request.query_params.get('exam_id')
        if exam_id:
            qs = qs.filter(exam_id=exam_id)
        class_id = self.request.query_params.get('class_id')
        if class_id:
            qs = qs.filter(class_assigned_id=class_id)
        subject_id = self.request.query_params.get('subject_id')
        if subject_id:
            qs = qs.filter(subjects__id=subject_id)
        return qs.distinct()

    @action(detail=False, methods=['post'], url_path='submit')
    def submit(self, request):
        if request.user.role != 'teacher':
            return Response({'error': 'Teacher access required'}, status=status.HTTP_403_FORBIDDEN)

        exam_id = request.data.get('exam_id')
        subject_id = request.data.get('subject_id')
        class_id = request.data.get('class_id')
        max_score = request.data.get('max_score', 100)
        scores = request.data.get('scores', [])

        if not exam_id or not subject_id or not class_id:
            return Response({'error': 'exam_id, subject_id, class_id are required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            teacher = request.user.teacher_profile
        except Exception:
            return Response({'error': 'Teacher profile not found'}, status=status.HTTP_404_NOT_FOUND)

        assigned = TeacherSubjectAssignment.objects.filter(
            teacher=teacher,
            class_assigned_id=class_id,
            subject_id=subject_id,
        ).exists()
        if not assigned:
            return Response({'error': 'Not assigned to this subject/class'}, status=status.HTTP_403_FORBIDDEN)

        exam = Exam.objects.filter(id=exam_id, class_assigned_id=class_id).first()
        if not exam:
            return Response({'error': 'Exam not found for this subject/class'}, status=status.HTTP_404_NOT_FOUND)

        schedule = ExamSchedule.objects.filter(exam=exam, subject_id=subject_id).first()
        if not schedule:
            return Response({'error': 'Subject not included in this exam'}, status=status.HTTP_404_NOT_FOUND)

        submission, _ = ResultSubmission.objects.get_or_create(
            teacher=teacher,
            class_assigned_id=class_id,
            exam=exam,
            defaults={
                'exam_title': exam.title or 'Exam',
                'max_score': max_score,
                'status': 'pending',
            },
        )
        submission.max_score = max_score
        submission.status = 'pending'
        submission.save(update_fields=['max_score', 'status'])
        submission.subjects.add(subject_id)

        created = 0
        for item in scores:
            student_id = item.get('student_id')
            score = item.get('score')
            if student_id is None or score is None:
                continue
            Mark.objects.update_or_create(
                student_id=student_id,
                class_assigned_id=class_id,
                subject_id=subject_id,
                exam=exam,
                defaults={
                    'submission': submission,
                    'exam_name': exam.title or 'Exam',
                    'score': score,
                    'max_score': max_score,
                    'date': schedule.date,
                    'published': False,
                },
            )
            created += 1

        return Response({'message': 'Results submitted', 'count': created, 'submission_id': submission.id})

    @action(detail=True, methods=['post'], url_path='publish')
    def publish(self, request, pk=None):
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        submission = self.get_object()
        submission.status = 'published'
        submission.reviewed_by = request.user
        submission.reviewed_at = timezone.now()
        submission.save(update_fields=['status', 'reviewed_by', 'reviewed_at'])
        Mark.objects.filter(submission=submission).update(published=True)
        return Response({'message': 'Results published'})


class ExamViewSet(viewsets.ModelViewSet):
    queryset = Exam.objects.all().prefetch_related('schedules', 'schedules__subject')
    serializer_class = ExamSerializer
    permission_classes = [IsAuthenticated]

    def _ensure_exam_fee(self, exam):
        if not exam.exam_fee or exam.exam_fee <= 0:
            return

        # Determine month from first schedule or today
        first_schedule = exam.schedules.order_by('date').first()
        date_ref = first_schedule.date if first_schedule else timezone.now().date()
        month_key = date_ref.strftime('%B').lower()
        
        fee_title = f"{exam.title} Fee"
        
        # Create fee for each student in the class
        students = Student.objects.filter(student_class=exam.class_assigned)
        fees_to_create = []

        for student in students:
            if not Fee.objects.filter(student=student, exam=exam).exists():
                fees_to_create.append(Fee(
                    title=fee_title,
                    student=student,
                    class_assigned=exam.class_assigned,
                    exam=exam,
                    amount=exam.exam_fee,
                    month=month_key,
                    status='running',
                    fee_type='exam',
                ))
        
        if fees_to_create:
            Fee.objects.bulk_create(fees_to_create)

    def get_queryset(self):
        user = self.request.user
        qs = Exam.objects.all().prefetch_related('schedules', 'schedules__subject')
        
        if user.role == 'admin':
            pass
        elif user.role == 'teacher':
            try:
                teacher = user.teacher_profile
                assignments = TeacherSubjectAssignment.objects.filter(teacher=teacher)
                
                if not assignments.exists():
                    return Exam.objects.none()
                
                # Precise filtering: Exam must be for a class/subject pair the teacher is assigned to
                q_obj = models.Q()
                for assignment in assignments:
                    q_obj |= models.Q(class_assigned_id=assignment.class_assigned_id, schedules__subject_id=assignment.subject_id)
                
                qs = qs.filter(q_obj).distinct()
                qs = qs.filter(published=True)
            except Exception:
                return Exam.objects.none()
        elif user.role == 'student':
            try:
                student = user.student_profile
                if student.student_class:
                    qs = qs.filter(class_assigned=student.student_class, published=True)
                else:
                    return Exam.objects.none()
            except Exception:
                return Exam.objects.none()
        else:
            return Exam.objects.none()
            
        return qs

    def create(self, request, *args, **kwargs):
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        data = request.data
        schedules_data = data.get('schedules', [])
        
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        exam = serializer.save()
        
        for sch in schedules_data:
            subject_id = sch.get('subject') or sch.get('subject_id')
            if not subject_id: continue
            
            ExamSchedule.objects.create(
                exam=exam,
                subject_id=subject_id,
                date=sch.get('date'),
                start_time=sch.get('start_time'),
                end_time=sch.get('end_time')
            )
            
        self._ensure_exam_fee(exam)
        
        return Response(ExamSerializer(exam).data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        exam = self.get_object()

        from fees.models import Fee, Payment, FeePaymentIntent
        from academics.models import ExamSchedule, Mark, ResultSubmission

        Payment.objects.filter(exam=exam).delete()
        FeePaymentIntent.objects.filter(fee__exam=exam).delete()
        Fee.objects.filter(exam=exam).delete()
        Mark.objects.filter(exam=exam).delete()
        ResultSubmission.objects.filter(exam=exam).delete()
        ExamSchedule.objects.filter(exam=exam).delete()

        exam.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        exam = self.get_object()
        exam.published = True
        exam.save()
        self._ensure_exam_fee(exam)
        return Response({'message': 'Exam published'})

    @action(detail=True, methods=['post'])
    def publish_result(self, request, pk=None):
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        exam = self.get_object()
        exam.results_published = True
        exam.save()
        # Publish all marks associated with this exam
        Mark.objects.filter(exam=exam).update(published=True)
        return Response({'message': 'Results published'})


    @action(detail=True, methods=['get'])
    def download_routine(self, request, pk=None):
        exam = self.get_object()
        user = request.user
        
        if user.role == 'student':
            if exam.class_assigned != user.student_profile.student_class:
                return Response({'error': 'Denied'}, status=403)
            
            if exam.exam_fee > 0:
                 has_paid = Payment.objects.filter(
                     student=user.student_profile,
                     fee__exam=exam,
                     status='approved'
                 ).exists()
                 if not has_paid:
                     return Response({'error': 'Fee not paid'}, status=403)
                     
        schedules = exam.schedules.all().order_by('date', 'start_time')
        filename, pdf_bytes = generate_exam_routine_pdf(exam.title, str(exam.class_assigned), schedules)
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

    @action(detail=True, methods=['get'])
    def download_admit_card(self, request, pk=None):
        if request.user.role != 'student':
            return Response({'error': 'Student access required'}, status=status.HTTP_403_FORBIDDEN)

        exam = self.get_object()
        student = request.user.student_profile
        
        if exam.class_assigned != student.student_class:
             return Response({'error': 'Denied'}, status=403)
             
        if exam.exam_fee > 0:
             has_paid = Payment.objects.filter(
                 student=student,
                 fee__exam=exam,
                 status='approved'
             ).exists()
             if not has_paid:
                 return Response({'error': 'Fee not paid'}, status=403)
        
        schedules = exam.schedules.all().order_by('date', 'start_time')
        filename, pdf_bytes = generate_exam_admit_card_pdf(student, exam.title, schedules)
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
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
            except Exception:
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
