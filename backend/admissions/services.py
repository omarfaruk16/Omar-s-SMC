from __future__ import annotations

from io import BytesIO
from typing import Optional, Tuple

from django.core import signing
from django.utils import timezone

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics

from users.models import Student
from .models import AdmissionFormTemplate

MULTILINE_FIELDS = {"address"}
REGISTRATION_TOKEN_SALT = "admissions.registration-download"
TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24  # 24 hours


def _parse_color(value: str, fallback: str) -> colors.Color:
    try:
        return colors.HexColor(value)
    except Exception:
        return colors.HexColor(fallback)


def _safe_font(font_name: Optional[str], fallback: str) -> str:
    if not font_name:
        return fallback
    if font_name in pdfmetrics.getRegisteredFontNames():
        return font_name
    # Also consider built-in default alias names
    standard_fonts = pdfmetrics.standardFonts
    if font_name in standard_fonts:
        return font_name
    return fallback


def _resolve_student_value(student: Student, source: str) -> str:
    if not student:
        return ""

    if source == "student_class":
        return str(student.student_class) if student.student_class else ""
    if source == "registration_id":
        return f"STD-{student.id:05d}"
    if source == "submission_date":
        return timezone.localtime(student.user.date_joined).strftime("%d %B %Y")

    # Support dotted attribute path resolution
    value = student
    for attr in source.split("."):
        value = getattr(value, attr, "")
        if value in ("", None):
            break
    if value in (None, ""):
        return ""
    return str(value)


def _collect_field_values(
    template: AdmissionFormTemplate,
    student: Optional[Student],
    form_data: Optional[dict],
) -> list[dict]:
    fields = []
    for definition in template.field_definitions:
        value = ""
        if form_data is not None:
            raw_value = form_data.get(definition["name"], "")
            value = "" if raw_value is None else str(raw_value)
        elif student:
            value = _resolve_student_value(student, definition["source"])
        fields.append({**definition, "value": value})
    return fields


def generate_admission_form_pdf(
    template: AdmissionFormTemplate,
    student: Optional[Student] = None,
    form_data: Optional[dict] = None,
) -> Tuple[str, bytes]:
    """Render the configured admission form (blank or pre-filled)."""

    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    left_margin = 20 * mm
    right_margin = 20 * mm
    top_margin = 25 * mm
    bottom_margin = 20 * mm
    content_width = width - left_margin - right_margin

    primary_color = _parse_color(template.primary_color, "#2563eb")
    accent_color = _parse_color(template.accent_color, "#1e40af")
    text_color = _parse_color(template.text_color, "#111827")
    header_bg_color = _parse_color(template.header_background_color, "#1f2937")
    header_text_color = _parse_color(template.header_text_color, "#ffffff")

    # Background artwork
    if template.background_image:
        try:
            bg = ImageReader(template.background_image.path)
            pdf.drawImage(bg, 0, 0, width=width, height=height, mask="auto")
        except Exception:
            pass
    elif template.watermark_text:
        pdf.saveState()
        pdf.translate(width / 2, height / 2)
        pdf.rotate(35)
        pdf.setFillColor(_parse_color("#e5e7eb", "#e5e7eb"))
        pdf.setFont(template.body_font_name or "Helvetica", 36)
        pdf.drawCentredString(0, 0, template.watermark_text)
        pdf.restoreState()

    # Header block
    header_height = 45 * mm
    pdf.setFillColor(header_bg_color)
    pdf.rect(0, height - header_height, width, header_height, fill=1, stroke=0)

    logo_margin = 0
    if template.logo:
        try:
            logo_reader = ImageReader(template.logo.path)
            logo_size = 28 * mm
            logo_y = height - header_height / 2 - logo_size / 2
            pdf.drawImage(
                logo_reader,
                left_margin,
                logo_y,
                width=logo_size,
                height=logo_size,
                mask="auto",
                preserveAspectRatio=True,
            )
            logo_margin = logo_size + 10
        except Exception:
            logo_margin = 0

    text_x = left_margin + logo_margin
    current_y = height - top_margin
    pdf.setFont(_safe_font(template.header_font_name, "Helvetica-Bold"), 20)
    pdf.setFillColor(header_text_color)
    pdf.drawString(text_x, current_y, template.school_name)

    pdf.setFont(_safe_font(template.body_font_name, "Helvetica"), 11)
    if template.slogan:
        current_y -= 14
        pdf.drawString(text_x, current_y, template.slogan)
    if template.school_address:
        current_y -= 12
        pdf.drawString(text_x, current_y, template.school_address)
    if template.eiin_number:
        current_y -= 12
        pdf.drawString(text_x, current_y, f"EIIN: {template.eiin_number}")

    pdf.setStrokeColor(primary_color)
    pdf.setLineWidth(1.2)
    pdf.line(left_margin, height - header_height - 5, width - right_margin, height - header_height - 5)

    # Title
    pdf.setFillColor(primary_color)
    pdf.setFont(_safe_font(template.header_font_name, "Helvetica-Bold"), 16)
    section_title_y = height - header_height - 25
    pdf.drawString(left_margin, section_title_y, "Student Admission Form")

    # Form fields
    pdf.setFillColor(text_color)
    pdf.setFont(_safe_font(template.body_font_name, "Helvetica"), template.body_font_size or 10)
    field_y = section_title_y - 20
    form = pdf.acroForm

    fields = _collect_field_values(template, student, form_data)
    field_height = 16
    line_spacing = 12

    for field in fields:
        label = field["label"]
        name = field["name"]
        value = field["value"]
        source = field["source"]
        is_multiline = field.get("multiline", False) or name in MULTILINE_FIELDS or source in {"address"}
        current_height = 36 if is_multiline else field_height

        if field_y - current_height < bottom_margin:
            pdf.showPage()
            pdf.setFillColor(text_color)
            pdf.setFont(_safe_font(template.body_font_name, "Helvetica"), template.body_font_size or 10)
            field_y = height - top_margin

        pdf.setFont(_safe_font(template.body_font_name, "Helvetica"), (template.label_font_size or 11))
        pdf.drawString(left_margin, field_y, label)

        field_bottom = field_y - (current_height + 4)

        field_kwargs = {
            "name": f"{template.slug}_{name}",
            "tooltip": label,
            "x": left_margin,
            "y": field_bottom,
            "width": content_width,
            "height": current_height,
            "value": value,
            "borderWidth": 0.8,
            "borderStyle": "underlined" if not is_multiline else "solid",
            "borderColor": accent_color,
            "fillColor": colors.white,
            "textColor": text_color,
            "fontName": _safe_font(template.body_font_name, "Helvetica"),
            "fontSize": (template.body_font_size or 10),
            "forceBorder": True,
        }

        if is_multiline:
            field_kwargs["fieldFlags"] = "multiline"

        form.textfield(**field_kwargs)

        field_y = field_bottom - line_spacing

    # Signature area
    signature_caption = template.signature_caption or "Guardian Signature"
    signature_line_y = bottom_margin + 30
    pdf.setStrokeColor(accent_color)
    pdf.line(width - right_margin - 150, signature_line_y, width - right_margin, signature_line_y)
    pdf.setFont(_safe_font(template.body_font_name, "Helvetica"), template.body_font_size or 10)
    pdf.drawString(width - right_margin - 145, signature_line_y + 6, signature_caption)

    # Footer
    pdf.setFillColor(primary_color)
    pdf.setLineWidth(0.5)
    pdf.line(left_margin, bottom_margin + 10, width - right_margin, bottom_margin + 10)

    pdf.setFont(_safe_font(template.body_font_name, "Helvetica"), 9)
    pdf.setFillColor(text_color)
    footer_lines = [template.footer_text, template.footer_secondary_text]
    footer_lines = [line for line in footer_lines if line]
    footer_y = bottom_margin
    for line in footer_lines:
        pdf.drawCentredString(width / 2, footer_y, line)
        footer_y -= 12

    pdf.setTitle(f"{template.school_name} Admission Form")
    pdf.showPage()
    pdf.save()

    buffer.seek(0)

    if student:
        filename = f"{template.slug or 'admission-form'}-{student.user.last_name or student.user.username}-filled.pdf"
    elif form_data:
        filename = f"{template.slug or 'admission-form'}-filled.pdf"
    else:
        filename = f"{template.slug or 'admission-form'}-blank.pdf"

    return filename, buffer.getvalue()


def build_registration_download_token(student: Student) -> str:
    payload = {"student_id": student.id, "issued_at": timezone.now().timestamp()}
    return signing.dumps(payload, salt=REGISTRATION_TOKEN_SALT)


def resolve_registration_download_token(token: str) -> int:
    try:
        payload = signing.loads(token, salt=REGISTRATION_TOKEN_SALT, max_age=TOKEN_MAX_AGE_SECONDS)
    except signing.BadSignature as exc:
        raise ValueError("Invalid or expired download link.") from exc
    student_id = payload.get("student_id")
    if not student_id:
        raise ValueError("Malformed download token.")
    return student_id
