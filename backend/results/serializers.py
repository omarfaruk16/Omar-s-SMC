from rest_framework import serializers
from .models import Result


class ResultSerializer(serializers.ModelSerializer):
    """Serializer for Result model"""
    file = serializers.FileField(required=False, allow_null=True, use_url=False)

    class Meta:
        model = Result
        fields = ['id', 'title', 'file', 'published_date', 'is_active']
        read_only_fields = ['id', 'published_date']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.file:
            request = self.context.get('request')
            url = instance.file.url
            data['file'] = request.build_absolute_uri(url) if request is not None else url
        else:
            data['file'] = None
        return data

