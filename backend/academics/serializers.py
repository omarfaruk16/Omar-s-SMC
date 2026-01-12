from rest_framework import serializers
from .models import Subject, AttendanceRecord, TimetableSlot, Mark, Exam, TeacherSubjectAssignment


class SubjectSerializer(serializers.ModelSerializer):
    classes_detail = serializers.SerializerMethodField()

    class Meta:
        model = Subject
        fields = ['id', 'name', 'code', 'description', 'classes', 'classes_detail']

    def get_classes_detail(self, obj):
        return [
            {
                'id': c.id,
                'name': c.name,
                'section': c.section,
            }
            for c in obj.classes.all()
        ]


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

    class Meta:
        model = Mark
        fields = ['id','student','student_name','class_assigned','class_name','subject','subject_name','exam_name','score','max_score','date','published']
        read_only_fields = ['id','student_name','class_name','subject_name']

    def get_student_name(self, obj):
        return obj.student.user.get_full_name()

    def get_class_name(self, obj):
        return str(obj.class_assigned)

    def get_subject_name(self, obj):
        return obj.subject.name


class ExamSerializer(serializers.ModelSerializer):
    class_name = serializers.SerializerMethodField()
    subject_name = serializers.SerializerMethodField()
    invigilator_name = serializers.SerializerMethodField()

    class Meta:
        model = Exam
        fields = ['id', 'title', 'class_assigned', 'class_name', 'subject', 'subject_name', 'date', 'start_time', 'end_time', 'description', 'invigilator', 'invigilator_name', 'published']
        read_only_fields = ['id', 'class_name', 'subject_name', 'invigilator_name']

    def get_class_name(self, obj):
        return str(obj.class_assigned)

    def get_subject_name(self, obj):
        return obj.subject.name if obj.subject else None

    def get_invigilator_name(self, obj):
        return obj.invigilator.user.get_full_name() if obj.invigilator else None


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
