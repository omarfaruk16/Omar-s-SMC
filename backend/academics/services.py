from io import BytesIO
import os
from typing import Iterable, Tuple

from django.utils import timezone

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfgen import canvas

from admissions.models import AdmissionFormTemplate

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
DEFAULT_LOGO_PATH = os.path.join(REPO_ROOT, 'frontend', 'public', 'rozey-mozammel-womens-college-logo.png')
DEFAULT_SCHOOL_NAME = "Rosey Mozammel Women's College"
DEFAULT_SCHOOL_BN = "রোজী মোজাম্মেল মহিলা কলেজ"
DEFAULT_PHONE = "01309-124030"
DEFAULT_EMAIL = "roseycollege@gmail.com"


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


def _get_logo_path(template) -> str | None:
    if template and template.logo:
        return template.logo.path
    if os.path.exists(DEFAULT_LOGO_PATH):
        return DEFAULT_LOGO_PATH
    return None


def _draw_college_header(pdf, width, height, template, title: str) -> float:
    school_name = template.school_name if template and template.school_name else DEFAULT_SCHOOL_NAME
    school_address = template.school_address if template else ""
    eiin_number = template.eiin_number if template else ""
    header_text_color = "#111827"
    primary_color = template.primary_color if template else "#2563eb"
    body_font = _safe_font(template.body_font_name if template else "Helvetica", "Helvetica")
    header_font = _safe_font(template.header_font_name if template else "Helvetica-Bold", "Helvetica-Bold")
    logo_path = _get_logo_path(template)

    pdf.setFillColor(colors.HexColor("#ffffff"))
    pdf.rect(0, height - 32 * mm, width, 32 * mm, fill=1, stroke=0)

    if logo_path:
        try:
            logo_reader = ImageReader(logo_path)
            logo_size = 22 * mm
            pdf.drawImage(logo_reader, 18 * mm, height - 28 * mm, width=logo_size, height=logo_size, mask="auto")
        except Exception:
            pass

    text_x = 18 * mm + (26 * mm if logo_path else 0)
    pdf.setFillColor(colors.HexColor(header_text_color))
    pdf.setFont(header_font, 16)
    pdf.drawString(text_x, height - 16 * mm, school_name)
    pdf.setFont(body_font, 10)
    pdf.drawString(text_x, height - 22 * mm, DEFAULT_SCHOOL_BN)
    line = " · ".join(filter(None, [DEFAULT_PHONE, DEFAULT_EMAIL]))
    if line:
        pdf.drawString(text_x, height - 27 * mm, line)
    if school_address:
        pdf.drawRightString(width - 18 * mm, height - 22 * mm, school_address)
    if eiin_number:
        pdf.drawRightString(width - 18 * mm, height - 27 * mm, f"EIIN: {eiin_number}")

    pdf.setFillColor(colors.HexColor(primary_color))
    pdf.rect(0, height - 36 * mm, width, 4 * mm, fill=1, stroke=0)

    pdf.setFillColor(colors.HexColor("#111827"))
    pdf.setFont(header_font, 14)
    pdf.drawCentredString(width / 2, height - 44 * mm, title)

    return height - 52 * mm


def generate_exam_admit_card_pdf(student, exam_title: str, exams: Iterable) -> Tuple[str, bytes]:
    template = AdmissionFormTemplate.get_default()
    school_name = template.school_name if template else "School"
    school_address = template.school_address if template else ""
    school_slogan = template.slogan if template else ""
    eiin_number = template.eiin_number if template else ""
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

    # Watermark
    if exam_title:
        pdf.saveState()
        pdf.translate(width / 2, height / 2)
        pdf.rotate(35)
        pdf.setFillColor(colors.HexColor("#e5e7eb"))
        pdf.setFont(header_font, 40)
        pdf.drawCentredString(0, 0, exam_title.upper())
        pdf.restoreState()

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
    pdf.setFont(body_font, 10)
    if school_slogan:
        pdf.drawString(text_x, height - 26 * mm, school_slogan)
    if school_address:
        pdf.drawString(text_x, height - 31 * mm, school_address)
    if eiin_number:
        pdf.drawString(text_x, height - 36 * mm, f"EIIN: {eiin_number}")

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
    guardian = student.guardian_name or "-"
    pdf.drawString(left_margin, info_y - 4 * line_gap, f"Guardian: {guardian}")
    pdf.drawString(left_margin, info_y - 5 * line_gap, f"Issue Date: {timezone.localdate().isoformat()}")

    # Table header
    table_top = info_y - 7 * line_gap
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


def generate_exam_routine_pdf(exam_title: str, class_name: str, exams: Iterable) -> Tuple[str, bytes]:
    template = AdmissionFormTemplate.get_default()
    primary_color = template.primary_color if template else "#2563eb"
    body_font = _safe_font(template.body_font_name if template else "Helvetica", "Helvetica")
    header_font = _safe_font(template.header_font_name if template else "Helvetica-Bold", "Helvetica-Bold")

    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    left_margin = 18 * mm
    right_margin = 18 * mm
    top_margin = 20 * mm
    content_width = width - left_margin - right_margin

    header_bottom = _draw_college_header(pdf, width, height, template, exam_title or "Exam Routine")
    pdf.setFont(body_font, 11)
    pdf.setFillColor(colors.black)
    pdf.drawCentredString(width / 2, header_bottom + 2 * mm, f"Class: {class_name}")

    # Table header
    table_top = header_bottom - 8 * mm
    pdf.setFillColor(colors.HexColor(primary_color))
    pdf.rect(left_margin, table_top, content_width, 8 * mm, fill=1, stroke=0)
    pdf.setFillColor(colors.white)
    pdf.setFont(header_font, 11)
    pdf.drawString(left_margin + 4, table_top + 2.5 * mm, "Subject")
    pdf.drawString(left_margin + content_width * 0.55, table_top + 2.5 * mm, "Date")
    pdf.drawString(left_margin + content_width * 0.75, table_top + 2.5 * mm, "Time")

    pdf.setFillColor(colors.black)
    pdf.setFont(body_font, 10)
    row_y = table_top - 6 * mm
    for exam in exams:
        subject_name = exam.subject.name if exam.subject else "-"
        date_text = str(exam.date) if exam.date else "N/A"
        if exam.start_time and exam.end_time:
            time_text = f"{exam.start_time} - {exam.end_time}"
        elif exam.start_time:
            time_text = str(exam.start_time)
        else:
            time_text = "N/A"
        pdf.drawString(left_margin + 4, row_y, subject_name)
        pdf.drawString(left_margin + content_width * 0.55, row_y, date_text)
        pdf.drawString(left_margin + content_width * 0.75, row_y, time_text)
        row_y -= 6 * mm
        if row_y < 20 * mm:
            pdf.showPage()
            row_y = height - 30 * mm

    pdf.showPage()
    pdf.save()
    buffer.seek(0)
    filename = f"exam-routine-{class_name.replace(' ', '_')}.pdf"
    return filename, buffer.read()


def generate_marksheet_pdf(student, exam_title: str, class_name: str, marks: Iterable) -> Tuple[str, bytes]:
    template = AdmissionFormTemplate.get_default()
    primary_color = template.primary_color if template else "#2563eb"
    body_font = _safe_font(template.body_font_name if template else "Helvetica", "Helvetica")
    header_font = _safe_font(template.header_font_name if template else "Helvetica-Bold", "Helvetica-Bold")

    roll = student.roll_number or f"STD-{student.id:05d}"

    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    left_margin = 18 * mm
    right_margin = 18 * mm
    content_width = width - left_margin - right_margin

    header_bottom = _draw_college_header(pdf, width, height, template, exam_title or "Marksheet")
    pdf.setFont(body_font, 11)
    pdf.setFillColor(colors.black)
    pdf.drawCentredString(width / 2, header_bottom + 2 * mm, f"Class: {class_name}")

    # Student info
    info_y = header_bottom - 8 * mm
    line_gap = 6 * mm
    session_text = student.session or (student.student_class.session if student.student_class else "-")
    pdf.setFont(body_font, 10)
    pdf.drawString(left_margin, info_y, f"Student: {student.user.get_full_name()}")
    pdf.drawString(left_margin, info_y - line_gap, f"Roll: {roll}")
    pdf.drawString(left_margin, info_y - 2 * line_gap, f"Session: {session_text}")
    pdf.drawRightString(width - right_margin, info_y, f"Exam: {exam_title}")
    pdf.drawRightString(width - right_margin, info_y - line_gap, f"Issue Date: {timezone.localdate().isoformat()}")

    # Table header
    table_top = info_y - 4 * line_gap
    pdf.setFillColor(colors.HexColor(primary_color))
    pdf.rect(left_margin, table_top, content_width, 8 * mm, fill=1, stroke=0)
    pdf.setFillColor(colors.white)
    pdf.setFont(header_font, 11)
    pdf.drawString(left_margin + 4, table_top + 2.5 * mm, "Subject")
    pdf.drawString(left_margin + content_width * 0.60, table_top + 2.5 * mm, "Obtained")
    pdf.drawString(left_margin + content_width * 0.78, table_top + 2.5 * mm, "Total")

    pdf.setFillColor(colors.black)
    pdf.setFont(body_font, 10)
    row_y = table_top - 6 * mm
    total_score = 0
    total_max = 0

    for mark in marks:
        subject_name = mark.subject.name if mark.subject else "-"
        score = float(mark.score)
        max_score = float(mark.max_score) if mark.max_score else 0
        total_score += score
        total_max += max_score

        pdf.drawString(left_margin + 4, row_y, subject_name)
        pdf.drawRightString(left_margin + content_width * 0.70, row_y, f"{score:g}")
        pdf.drawRightString(left_margin + content_width * 0.90, row_y, f"{max_score:g}")

        row_y -= 6 * mm
        if row_y < 20 * mm:
            pdf.showPage()
            row_y = height - 30 * mm

    # Totals
    pdf.setFont(header_font, 10)
    pdf.drawString(left_margin, row_y - 4 * mm, "Totals")
    pdf.drawRightString(left_margin + content_width * 0.70, row_y - 4 * mm, f"{total_score:g}")
    pdf.drawRightString(left_margin + content_width * 0.90, row_y - 4 * mm, f"{total_max:g}")

    pdf.showPage()
    pdf.save()
    buffer.seek(0)
    filename = f"marksheet-{class_name.replace(' ', '_')}.pdf"
    return filename, buffer.read()
