from rest_framework import serializers
from .models import Subject, AttendanceRecord, TimetableSlot, Mark, Exam, ExamSchedule, TeacherSubjectAssignment, ResultSubmission


class SubjectSerializer(serializers.ModelSerializer):
    class_name = serializers.SerializerMethodField()
    class_assigned_id = serializers.PrimaryKeyRelatedField(source='class_assigned', read_only=True)

    class Meta:
        model = Subject
        fields = ['id', 'name', 'code', 'description', 'class_assigned', 'class_assigned_id', 'class_name', 'fourth_subject_eligible', 'is_fourth_subject', 'subject_code']

    def get_class_name(self, obj):
        return str(obj.class_assigned)


class AttendanceRecordSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    class_name = serializers.SerializerMethodField()
    subject_name = serializers.SerializerMethodField()

    class Meta:
        model = AttendanceRecord
        fields = ['id', 'date', 'student', 'student_name', 'class_assigned', 'class_name', 'subject', 'subject_name', 'status', 'marked_by', 'created_at']
        read_only_fields = ['id', 'student_name', 'class_name', 'subject_name', 'marked_by', 'created_at']

    def get_student_name(self, obj):
        return obj.student.user.get_full_name()

    def get_class_name(self, obj):
        return str(obj.class_assigned)

    def get_subject_name(self, obj):
        return obj.subject.name if obj.subject else None


class TimetableSlotSerializer(serializers.ModelSerializer):
    class_name = serializers.SerializerMethodField()
    subject_name = serializers.SerializerMethodField()
    teacher_name = serializers.SerializerMethodField()

    class Meta:
        model = TimetableSlot
        fields = [
            'id', 'class_assigned', 'class_name', 'weekday', 'start_time', 'end_time',
            'subject', 'subject_name', 'teacher', 'teacher_name'
        ]
        read_only_fields = ['id', 'class_name', 'subject_name', 'teacher_name']

    def get_class_name(self, obj):
        return str(obj.class_assigned)

    def get_subject_name(self, obj):
        return obj.subject.name if obj.subject else None

    def get_teacher_name(self, obj):
        return obj.teacher.user.get_full_name() if obj.teacher else None


class MarkSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    class_name = serializers.SerializerMethodField()
    subject_name = serializers.SerializerMethodField()
    exam_title = serializers.SerializerMethodField()

    class Meta:
        model = Mark
        fields = ['id','student','student_name','class_assigned','class_name','subject','subject_name','exam','exam_title','exam_name','score','max_score','date','published']
        read_only_fields = ['id','student_name','class_name','subject_name']

    def get_student_name(self, obj):
        return obj.student.user.get_full_name()

    def get_class_name(self, obj):
        return str(obj.class_assigned)

    def get_subject_name(self, obj):
        return obj.subject.name

    def get_exam_title(self, obj):
        if obj.exam and obj.exam.title:
            return obj.exam.title
        return obj.exam_name or None


class ExamScheduleSerializer(serializers.ModelSerializer):
    subject_name = serializers.ReadOnlyField(source='subject.name')
    subject_code = serializers.ReadOnlyField(source='subject.code')

    class Meta:
        model = ExamSchedule
        fields = ['id', 'subject', 'subject_name', 'subject_code', 'date', 'start_time', 'end_time']
        read_only_fields = ['id', 'subject_name', 'subject_code']


class ExamSerializer(serializers.ModelSerializer):
    class_name = serializers.ReadOnlyField(source='class_assigned.name')
    schedules = ExamScheduleSerializer(many=True, read_only=True)

    class Meta:
        model = Exam
        fields = ['id', 'title', 'class_assigned', 'class_name', 'exam_fee', 'published', 'results_published', 'created_at', 'schedules']
        read_only_fields = ['id', 'created_at', 'class_name']

    def validate_exam_fee(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError('Exam fee must be zero or positive.')
        return value


class TeacherSubjectAssignmentSerializer(serializers.ModelSerializer):
    """Serializer for TeacherSubjectAssignment model"""
    teacher_name = serializers.SerializerMethodField()
    subject_name = serializers.SerializerMethodField()
    class_name = serializers.SerializerMethodField()

    class Meta:
        model = TeacherSubjectAssignment
        fields = ['id', 'teacher', 'teacher_name', 'subject', 'subject_name', 'class_assigned', 'class_name']
        read_only_fields = ['id', 'teacher_name', 'subject_name', 'class_name']

    def get_teacher_name(self, obj):
        return obj.teacher.user.get_full_name()

    def get_subject_name(self, obj):
        return obj.subject.name

    def get_class_name(self, obj):
        return str(obj.class_assigned)


class ResultSubmissionSerializer(serializers.ModelSerializer):
    teacher_name = serializers.SerializerMethodField()
    class_name = serializers.SerializerMethodField()
    subject_ids = serializers.SerializerMethodField()

    class Meta:
        model = ResultSubmission
        fields = ['id', 'teacher', 'teacher_name', 'class_assigned', 'class_name', 'subjects', 'subject_ids', 'exam', 'exam_title', 'max_score', 'status', 'submitted_at']
        read_only_fields = ['id', 'teacher_name', 'class_name', 'subject_ids', 'submitted_at']

    def get_teacher_name(self, obj):
        return obj.teacher.user.get_full_name() if obj.teacher else None

    def get_class_name(self, obj):
        return str(obj.class_assigned) if obj.class_assigned else None

    def get_subject_ids(self, obj):
        return list(obj.subjects.values_list('id', flat=True))
