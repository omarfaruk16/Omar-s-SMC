from rest_framework import serializers
from rest_framework.reverse import reverse

from .models import AdmissionFormTemplate, AdmissionFormSubmission


class AdmissionFormTemplateSerializer(serializers.ModelSerializer):
    logo_url = serializers.SerializerMethodField()
    background_image_url = serializers.SerializerMethodField()
    field_definitions = serializers.SerializerMethodField()
    logo = serializers.ImageField(write_only=True, required=False, allow_null=True)
    background_image = serializers.ImageField(write_only=True, required=False, allow_null=True)
    remove_logo = serializers.BooleanField(write_only=True, required=False, default=False)
    remove_background_image = serializers.BooleanField(write_only=True, required=False, default=False)
    blank_download_url = serializers.SerializerMethodField()

    class Meta:
        model = AdmissionFormTemplate
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "school_name",
            "school_address",
            "eiin_number",
            "slogan",
            "footer_text",
            "footer_secondary_text",
            "logo",
            "logo_url",
            "background_image",
            "background_image_url",
            "blank_download_url",
            "header_background_color",
            "header_text_color",
            "primary_color",
            "accent_color",
            "text_color",
            "header_font_name",
            "body_font_name",
            "label_font_size",
            "body_font_size",
            "watermark_text",
            "signature_caption",
            "is_default",
            "layout_metadata",
            "field_definitions",
            "remove_logo",
            "remove_background_image",
        ]
        extra_kwargs = {
            "slug": {"read_only": True},
        }

    def get_logo_url(self, obj):
        request = self.context.get("request")
        if obj.logo:
            url = obj.logo.url
            if request is not None:
                return request.build_absolute_uri(url)
            return url
        return None

    def get_background_image_url(self, obj):
        request = self.context.get("request")
        if obj.background_image:
            url = obj.background_image.url
            if request is not None:
                return request.build_absolute_uri(url)
            return url
        return None

    def get_field_definitions(self, obj):
        return obj.field_definitions

    def get_blank_download_url(self, obj):
        request = self.context.get("request")
        url_path = f"/api/admissions/templates/{obj.slug}/blank/"
        if not request:
            return url_path
        try:
            return request.build_absolute_uri(url_path)
        except Exception:
            return url_path

    def validate_layout_metadata(self, value):
        if isinstance(value, str):
            try:
                import json

                return json.loads(value)
            except json.JSONDecodeError as exc:
                raise serializers.ValidationError("Invalid layout metadata JSON") from exc
        return value

    def update(self, instance, validated_data):
        remove_logo = validated_data.pop("remove_logo", False)
        remove_background = validated_data.pop("remove_background_image", False)

        logo = validated_data.pop("logo", None)
        background = validated_data.pop("background_image", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if logo is not None:
            instance.logo = logo
        elif remove_logo:
            instance.logo = None

        if background is not None:
            instance.background_image = background
        elif remove_background:
            instance.background_image = None

        instance.save()
        return instance


class AdmissionFormSubmissionSerializer(serializers.ModelSerializer):
    applicant_name = serializers.SerializerMethodField()
    applicant_email = serializers.SerializerMethodField()
    applicant_phone = serializers.SerializerMethodField()
    template_name = serializers.CharField(source="template.name", read_only=True)

    class Meta:
        model = AdmissionFormSubmission
        fields = [
            "id",
            "template",
            "template_name",
            "form_data",
            "amount",
            "transaction_id",
            "status",
            "created_at",
            "paid_at",
            "applicant_name",
            "applicant_email",
            "applicant_phone",
        ]
        read_only_fields = fields

    def _get_field(self, obj, key):
        value = obj.form_data.get(key)
        if value in (None, ""):
            return ""
        return str(value)

    def get_applicant_name(self, obj):
        first = self._get_field(obj, "first_name")
        last = self._get_field(obj, "last_name")
        name = f"{first} {last}".strip()
        return name or self._get_field(obj, "guardian_name")

    def get_applicant_email(self, obj):
        return self._get_field(obj, "email")

    def get_applicant_phone(self, obj):
        return self._get_field(obj, "phone") or self._get_field(obj, "guardian_phone")
