from rest_framework import serializers
from .models import Notice


class NoticeSerializer(serializers.ModelSerializer):
    """Serializer for Notice model"""
    file = serializers.SerializerMethodField()

    class Meta:
        model = Notice
        fields = ['id', 'title', 'description', 'file', 'created_date', 'is_active', 'target_role', 'target_classes']
        read_only_fields = ['id', 'created_date']

    def get_file(self, obj):
        if not obj.file:
            return None
        request = self.context.get('request')
        url = obj.file.url
        return request.build_absolute_uri(url) if request is not None else url
