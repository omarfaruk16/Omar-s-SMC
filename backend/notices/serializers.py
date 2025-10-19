from rest_framework import serializers
from .models import Notice


class NoticeSerializer(serializers.ModelSerializer):
    """Serializer for Notice model"""
    
    class Meta:
        model = Notice
        fields = ['id', 'title', 'description', 'file', 'created_date', 'is_active', 'target_role', 'target_classes']
        read_only_fields = ['id', 'created_date']
