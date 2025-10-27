from django.db import migrations
from django.utils.text import slugify

from admissions.constants import DEFAULT_FIELD_SPECS


def create_default_template(apps, schema_editor):
    Template = apps.get_model("admissions", "AdmissionFormTemplate")
    if Template.objects.exists():
        return
    Template.objects.create(
        name="Standard Admission Form",
        slug=slugify("Standard Admission Form"),
        description="Default admission form layout with core student fields.",
        school_name="Rosey Mozammel Women's College",
        school_address="Gurudaspur, Natore, Bangladesh",
        eiin_number="123456",
        slogan="Empowering Women Through Education",
        footer_text="Rosey Mozammel Women's College • Gurudaspur, Natore",
        footer_secondary_text="For admission assistance call 01309-124030",
        header_background_color="#1f2937",
        header_text_color="#ffffff",
        primary_color="#2563eb",
        accent_color="#1e40af",
        text_color="#111827",
        header_font_name="Helvetica-Bold",
        body_font_name="Helvetica",
        label_font_size=11,
        body_font_size=10,
        watermark_text="Rosey Mozammel Women's College",
        signature_caption="Guardian Signature",
        is_default=True,
        layout_metadata={"fields": DEFAULT_FIELD_SPECS},
    )


def remove_default_template(apps, schema_editor):
    Template = apps.get_model("admissions", "AdmissionFormTemplate")
    Template.objects.filter(slug="standard-admission-form").delete()


class Migration(migrations.Migration):
    dependencies = [
        ("admissions", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(create_default_template, remove_default_template),
    ]
