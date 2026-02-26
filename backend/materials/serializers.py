from rest_framework import serializers
from .models import ClassMaterial, MaterialAttachment


class MaterialAttachmentSerializer(serializers.ModelSerializer):
    """Serializer for MaterialAttachment model"""
    file = serializers.FileField(required=False, allow_null=True, use_url=False)

    class Meta:
        model = MaterialAttachment
        fields = ['id', 'attachment_type', 'file', 'url', 'title', 'created_at']
        read_only_fields = ['id', 'created_at']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.file:
            request = self.context.get('request')
            url = instance.file.url
            data['file'] = request.build_absolute_uri(url) if request is not None else url
        else:
            data['file'] = None
        return data


class ClassMaterialSerializer(serializers.ModelSerializer):
    """Serializer for ClassMaterial model"""
    teacher_name = serializers.SerializerMethodField()
    class_name = serializers.SerializerMethodField()
    subject_name = serializers.SerializerMethodField()
    file = serializers.FileField(required=False, allow_null=True, use_url=False)
    attachments = MaterialAttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = ClassMaterial
        fields = ['id', 'title', 'description', 'link', 'file', 'teacher',
                  'teacher_name', 'class_assigned', 'class_name', 'subject', 'subject_name',
                  'uploaded_date', 'attachments']
        read_only_fields = ['id', 'uploaded_date', 'teacher_name', 'class_name', 'subject_name']

    def get_teacher_name(self, obj):
        return obj.teacher.user.get_full_name()

    def get_class_name(self, obj):
        return str(obj.class_assigned)

    def get_subject_name(self, obj):
        return obj.subject.name if obj.subject else None

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.file:
            request = self.context.get('request')
            url = instance.file.url
            data['file'] = request.build_absolute_uri(url) if request is not None else url
        else:
            data['file'] = None
        return data


class ClassMaterialCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating ClassMaterial"""
    attachments_data = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False,
        help_text='List of attachments: [{attachment_type: "file|url", title: "...", file: ..., url: "..."}]'
    )

    class Meta:
        model = ClassMaterial
        fields = ['id', 'title', 'description', 'link', 'file', 'class_assigned',
                  'subject', 'uploaded_date', 'attachments_data']
        read_only_fields = ['id', 'uploaded_date']

    def create(self, validated_data):
        attachments_data = validated_data.pop('attachments_data', [])
        # Teacher is set from request.user in the view
        material = super().create(validated_data)

        # Create attachments
        for attachment_data in attachments_data:
            MaterialAttachment.objects.create(
                material=material,
                **attachment_data
            )

        return material
