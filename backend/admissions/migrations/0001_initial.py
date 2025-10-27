from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="AdmissionFormTemplate",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=150)),
                ("slug", models.SlugField(blank=True, help_text="Used to reference this template in URLs.", unique=True)),
                ("description", models.CharField(blank=True, max_length=255)),
                ("school_name", models.CharField(max_length=255)),
                ("school_address", models.TextField(blank=True)),
                ("eiin_number", models.CharField(blank=True, max_length=64)),
                ("slogan", models.CharField(blank=True, max_length=255)),
                ("footer_text", models.CharField(blank=True, max_length=255)),
                ("footer_secondary_text", models.CharField(blank=True, max_length=255)),
                ("logo", models.ImageField(blank=True, null=True, upload_to="admissions/logos/")),
                ("background_image", models.ImageField(blank=True, null=True, upload_to="admissions/backgrounds/")),
                ("header_background_color", models.CharField(default="#1f2937", help_text="Hex color for header background.", max_length=7)),
                ("header_text_color", models.CharField(default="#ffffff", max_length=7)),
                ("primary_color", models.CharField(default="#2563eb", max_length=7)),
                ("accent_color", models.CharField(default="#1e40af", max_length=7)),
                ("text_color", models.CharField(default="#111827", max_length=7)),
                ("header_font_name", models.CharField(default="Helvetica-Bold", max_length=64)),
                ("body_font_name", models.CharField(default="Helvetica", max_length=64)),
                ("label_font_size", models.PositiveSmallIntegerField(default=11)),
                ("body_font_size", models.PositiveSmallIntegerField(default=10)),
                ("watermark_text", models.CharField(blank=True, max_length=255)),
                ("signature_caption", models.CharField(blank=True, default="Guardian Signature", max_length=255)),
                ("is_default", models.BooleanField(default=False)),
                ("layout_metadata", models.JSONField(blank=True, default=dict, help_text="Optional JSON to further customise the layout.")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "ordering": ["-is_default", "-updated_at"],
                "verbose_name": "Admission Form Template",
                "verbose_name_plural": "Admission Form Templates",
            },
        ),
    ]
