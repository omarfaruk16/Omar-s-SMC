from rest_framework import serializers
from .models import Notice


class NoticeSerializer(serializers.ModelSerializer):
    """Serializer for Notice model"""
    # Use a write-able FileField but override to_representation for absolute URL output
    file = serializers.FileField(required=False, allow_null=True, use_url=False)

    class Meta:
        model = Notice
        fields = ['id', 'title', 'description', 'file', 'created_date', 'is_active', 'target_role', 'target_classes']
        read_only_fields = ['id', 'created_date']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.file:
            request = self.context.get('request')
            url = instance.file.url
            data['file'] = request.build_absolute_uri(url) if request is not None else url
        else:
            data['file'] = None
        return data
