from rest_framework import serializers
from .models import Result


class ResultSerializer(serializers.ModelSerializer):
    """Serializer for Result model"""
    
    class Meta:
        model = Result
        fields = ['id', 'title', 'file', 'published_date', 'is_active']
        read_only_fields = ['id', 'published_date']
