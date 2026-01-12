from django.contrib import admin
from .models import AdmissionFormSubmission, AdmissionFormTemplate


@admin.register(AdmissionFormTemplate)
class AdmissionFormTemplateAdmin(admin.ModelAdmin):
    list_display = ("name", "school_name", "is_default", "updated_at")
    list_filter = ("is_default", "updated_at")
    search_fields = ("name", "school_name", "eiin_number")
    prepopulated_fields = {"slug": ("name",)}
    readonly_fields = ("created_at", "updated_at")
    fieldsets = (
        ("Template Info", {
            "fields": ("name", "slug", "description", "is_default")
        }),
        ("Institution Branding", {
            "fields": (
                "school_name",
                "school_address",
                "eiin_number",
                "slogan",
                "logo",
                "background_image",
            )
        }),
        ("Styling", {
            "classes": ("collapse",),
            "fields": (
                "header_background_color",
                "header_text_color",
                "primary_color",
                "accent_color",
                "text_color",
                "header_font_name",
                "body_font_name",
                "label_font_size",
                "body_font_size",
            )
        }),
        ("Footer & Watermark", {
            "classes": ("collapse",),
            "fields": (
                "footer_text",
                "footer_secondary_text",
                "watermark_text",
                "signature_caption",
            )
        }),
        ("Advanced", {
            "classes": ("collapse",),
            "fields": ("layout_metadata", "created_at", "updated_at")
        }),
    )

    actions = ["make_default"]

    @admin.action(description="Mark selected template as default")
    def make_default(self, request, queryset):
        template = queryset.first()
        if template:
            queryset.update(is_default=False)
            template.is_default = True
            template.save()


@admin.register(AdmissionFormSubmission)
class AdmissionFormSubmissionAdmin(admin.ModelAdmin):
    list_display = ("id", "template", "transaction_id", "status", "amount", "created_at", "paid_at")
    list_filter = ("status", "template", "created_at")
    search_fields = ("transaction_id",)
    readonly_fields = ("created_at", "paid_at", "gateway_payload")
