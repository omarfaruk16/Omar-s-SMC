from rest_framework import serializers
from .models import Result


class ResultSerializer(serializers.ModelSerializer):
    """Serializer for Result model"""
    file = serializers.SerializerMethodField()
    
    class Meta:
        model = Result
        fields = ['id', 'title', 'file', 'published_date', 'is_active']
        read_only_fields = ['id', 'published_date']

    def get_file(self, obj):
        request = self.context.get('request')
        if obj.file:
            url = obj.file.url
            if request is not None:
                return request.build_absolute_uri(url)
            return url
        return None
