from rest_framework import serializers
from .models import Class


class ClassSerializer(serializers.ModelSerializer):
    """Serializer for Class model"""
    student_count = serializers.SerializerMethodField()
    teacher_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Class
        fields = ['id', 'name', 'section', 'student_count', 'teacher_count']
    
    def get_student_count(self, obj):
        return obj.students.count()
    
    def get_teacher_count(self, obj):
        return obj.teachers.count()
