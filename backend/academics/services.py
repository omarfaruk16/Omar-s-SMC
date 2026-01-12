from io import BytesIO
from typing import Iterable, Tuple

from django.utils import timezone

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfgen import canvas

from admissions.models import AdmissionFormTemplate


def _safe_font(font_name: str, fallback: str) -> str:
    if not font_name:
        return fallback
    if font_name in pdfmetrics.getRegisteredFontNames():
        return font_name
    if font_name in pdfmetrics.standardFonts:
        return font_name
    return fallback


def _format_time(exam) -> str:
    if exam.start_time and exam.end_time:
        return f"{exam.start_time} - {exam.end_time}"
    if exam.start_time:
        return str(exam.start_time)
    return "-"


def generate_exam_admit_card_pdf(student, exam_title: str, exams: Iterable) -> Tuple[str, bytes]:
    template = AdmissionFormTemplate.get_default()
    school_name = template.school_name if template else "School"
    school_address = template.school_address if template else ""
    logo_path = template.logo.path if template and template.logo else None
    header_bg_color = template.header_background_color if template else "#1f2937"
    header_text_color = template.header_text_color if template else "#ffffff"
    primary_color = template.primary_color if template else "#2563eb"
    body_font = _safe_font(template.body_font_name if template else "Helvetica", "Helvetica")
    header_font = _safe_font(template.header_font_name if template else "Helvetica-Bold", "Helvetica-Bold")

    roll = student.roll_number or f"STD-{student.id:05d}"

    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    left_margin = 18 * mm
    right_margin = 18 * mm
    top_margin = 20 * mm
    content_width = width - left_margin - right_margin

    # Header
    pdf.setFillColor(colors.HexColor(header_bg_color))
    pdf.rect(0, height - 40 * mm, width, 40 * mm, fill=1, stroke=0)
    if logo_path:
        try:
            logo_reader = ImageReader(logo_path)
            logo_size = 22 * mm
            pdf.drawImage(logo_reader, left_margin, height - 32 * mm, width=logo_size, height=logo_size, mask="auto")
        except Exception:
            pass

    text_x = left_margin + (26 * mm if logo_path else 0)
    pdf.setFillColor(colors.HexColor(header_text_color))
    pdf.setFont(header_font, 18)
    pdf.drawString(text_x, height - 18 * mm, school_name)
    if school_address:
        pdf.setFont(body_font, 10)
        pdf.drawString(text_x, height - 26 * mm, school_address)

    pdf.setFillColor(colors.HexColor(primary_color))
    pdf.setFont(header_font, 16)
    pdf.drawString(left_margin, height - 55 * mm, "Exam Admit Card")

    pdf.setFillColor(colors.black)
    pdf.setFont(body_font, 11)
    info_y = height - 68 * mm
    line_gap = 6 * mm
    pdf.drawString(left_margin, info_y, f"Exam: {exam_title}")
    pdf.drawString(left_margin, info_y - line_gap, f"Student: {student.user.get_full_name()}")
    pdf.drawString(left_margin, info_y - 2 * line_gap, f"Class: {student.student_class or '-'}")
    pdf.drawString(left_margin, info_y - 3 * line_gap, f"Roll: {roll}")
    pdf.drawString(left_margin, info_y - 4 * line_gap, f"Issue Date: {timezone.localdate().isoformat()}")

    # Table header
    table_top = info_y - 6 * line_gap
    pdf.setFillColor(colors.HexColor(primary_color))
    pdf.rect(left_margin, table_top, content_width, 8 * mm, fill=1, stroke=0)
    pdf.setFillColor(colors.white)
    pdf.setFont(header_font, 11)
    pdf.drawString(left_margin + 4, table_top + 2.5 * mm, "Subject")
    pdf.drawString(left_margin + content_width * 0.55, table_top + 2.5 * mm, "Date")
    pdf.drawString(left_margin + content_width * 0.75, table_top + 2.5 * mm, "Time")

    # Table rows
    pdf.setFillColor(colors.black)
    pdf.setFont(body_font, 10)
    row_y = table_top - 6 * mm
    for exam in exams:
        subject_name = exam.subject.name if exam.subject else "-"
        pdf.drawString(left_margin + 4, row_y, subject_name)
        pdf.drawString(left_margin + content_width * 0.55, row_y, str(exam.date))
        pdf.drawString(left_margin + content_width * 0.75, row_y, _format_time(exam))
        row_y -= 6 * mm
        if row_y < 20 * mm:
            pdf.showPage()
            row_y = height - 30 * mm

    pdf.showPage()
    pdf.save()
    buffer.seek(0)
    filename = f"admit-card-{exam_title.replace(' ', '_')}.pdf"
    return filename, buffer.read()
