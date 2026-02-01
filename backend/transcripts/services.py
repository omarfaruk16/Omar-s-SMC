import os
from typing import Tuple, Dict, Any

from django.conf import settings
from django.template.loader import render_to_string
from django.utils import timezone

from weasyprint import HTML, CSS
from weasyprint.text.fonts import FontConfiguration

from admissions.models import AdmissionFormTemplate


# Get the directory where this file is located
FONTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fonts')


def _bn_digits(value) -> str:
    if value in (None, ""):
        return ""
    mapping = str.maketrans("0123456789", "০১২৩৪৫৬৭৮৯")
    return str(value).translate(mapping)


def _bn_date(value) -> str:
    if not value:
        return ""
    return _bn_digits(value.strftime("%d/%m/%Y"))


def _bn_date_words(value) -> str:
    if not value:
        return ""
    number_words = {
        0: "শূন্য", 1: "এক", 2: "দুই", 3: "তিন", 4: "চার", 5: "পাঁচ", 6: "ছয়", 7: "সাত", 8: "আট", 9: "নয়",
        10: "দশ", 11: "এগারো", 12: "বারো", 13: "তেরো", 14: "চৌদ্দ", 15: "পনেরো", 16: "ষোল", 17: "সতেরো",
        18: "আঠারো", 19: "উনিশ", 20: "বিশ", 21: "একুশ", 22: "বাইশ", 23: "তেইশ", 24: "চব্বিশ", 25: "পঁচিশ",
        26: "ছাব্বিশ", 27: "সাতাশ", 28: "আটাশ", 29: "ঊনত্রিশ", 30: "ত্রিশ", 31: "একত্রিশ", 32: "বত্রিশ",
        33: "তেত্রিশ", 34: "চৌত্রিশ", 35: "পঁয়ত্রিশ", 36: "ছত্রিশ", 37: "সাঁইত্রিশ", 38: "আটত্রিশ",
        39: "ঊনচল্লিশ", 40: "চল্লিশ", 41: "একচল্লিশ", 42: "বিয়াল্লিশ", 43: "তেতাল্লিশ", 44: "চুয়াল্লিশ",
        45: "পঁয়তাল্লিশ", 46: "ছেচল্লিশ", 47: "সাতচল্লিশ", 48: "আটচল্লিশ", 49: "ঊনপঞ্চাশ", 50: "পঞ্চাশ",
        51: "একান্ন", 52: "বায়ান্ন", 53: "তিপ্পান্ন", 54: "চুয়ান্ন", 55: "পঞ্চান্ন", 56: "ছাপ্পান্ন",
        57: "সাতান্ন", 58: "আটান্ন", 59: "ঊনষাট", 60: "ষাট", 61: "একষট্টি", 62: "বাষট্টি", 63: "তেষট্টি",
        64: "চৌষট্টি", 65: "পঁয়ষট্টি", 66: "ছেষট্টি", 67: "সাতষট্টি", 68: "আটষট্টি", 69: "ঊনসত্তর",
        70: "সত্তর", 71: "একাত্তর", 72: "বাহাত্তর", 73: "তিয়াত্তর", 74: "চুয়াত্তর", 75: "পঁচাত্তর",
        76: "ছিয়াত্তর", 77: "সাতাত্তর", 78: "আটাত্তর", 79: "ঊনআশি", 80: "আশি", 81: "একাশি",
        82: "বিরাশি", 83: "তিরাশি", 84: "চুরাশি", 85: "পঁচাশি", 86: "ছিয়াশি", 87: "সাতাশি", 88: "আটাশি",
        89: "ঊননব্বই", 90: "নব্বই", 91: "একানব্বই", 92: "বিরানব্বই", 93: "তিরানব্বই", 94: "চুরানব্বই",
        95: "পঁচানব্বই", 96: "ছিয়ানব্বই", 97: "সাতানব্বই", 98: "আটানব্বই", 99: "নিরানব্বই",
    }
    day_words = {
        1: "এক", 2: "দুই", 3: "তিন", 4: "চার", 5: "পাঁচ", 6: "ছয়", 7: "সাত", 8: "আট", 9: "নয়", 10: "দশ",
        11: "এগারো", 12: "বারো", 13: "তেরো", 14: "চৌদ্দ", 15: "পনেরো", 16: "ষোল", 17: "সতেরো", 18: "আঠারো",
        19: "উনিশ", 20: "বিশ", 21: "একুশ", 22: "বাইশ", 23: "তেইশ", 24: "চব্বিশ", 25: "পঁচিশ", 26: "ছাব্বিশ",
        27: "সাতাশ", 28: "আটাশ", 29: "ঊনত্রিশ", 30: "ত্রিশ", 31: "একত্রিশ",
    }
    month_words = {
        1: "জানুয়ারি", 2: "ফেব্রুয়ারি", 3: "মার্চ", 4: "এপ্রিল", 5: "মে", 6: "জুন",
        7: "জুলাই", 8: "আগস্ট", 9: "সেপ্টেম্বর", 10: "অক্টোবর", 11: "নভেম্বর", 12: "ডিসেম্বর",
    }
    year = value.year
    if 2000 <= year < 2100:
        remainder = year - 2000
        year_words = f"দুই হাজার {number_words.get(remainder, _bn_digits(remainder))}".strip()
    elif 1900 <= year < 2000:
        remainder = year - 1900
        year_words = f"উনিশ শত {number_words.get(remainder, _bn_digits(remainder))}".strip()
    else:
        year_words = _bn_digits(year)
    day_text = day_words.get(value.day, _bn_digits(value.day))
    month_text = month_words.get(value.month, _bn_digits(value.month))
    return f"{day_text} {month_text} {year_words}"


def get_student_context(testimonial_request, is_template=False) -> Dict[str, Any]:
    """Prepare context for testimonial form. Uses TestimonialDetails if approved, otherwise student data."""
    dots_short = "........................."
    dots_long = "........................................................"
    
    if is_template:
        # Left side - empty template for filling
        return {
            "serial_no": dots_short,
            "issue_date": "___/___/_______",
            "roll": dots_short,
            "registration_no": dots_short,
            "session": dots_short,
            "name_bn": dots_long,
            "name_en": dots_long,
            "father_bn": dots_long,
            "mother_bn": dots_long,
            "village": dots_short,
            "post_office": dots_short,
            "upazila": dots_short,
            "district": dots_short,
            "exam_year": "২০.......",
            "gpa": "..........",
            "dob_numeric": "___/___/_______",
            "dob_words": dots_long,
        }

    # Use TestimonialDetails if available (approved testimonial), otherwise use student data
    student = testimonial_request.student
    issue_date = timezone.localdate()
    
    if hasattr(testimonial_request, 'details'):
        # Use approved testimonial details
        details = testimonial_request.details
        roll = details.roll_number or ""
        registration_no = details.registration or ""
        session = details.session or ""
        name_bn = details.bangla_name or ""
        name_en = details.name or ""
        father_bn = details.father_bn or ""
        mother_bn = details.mother_bn or ""
        village = details.village or ""
        post_office = details.post_office or ""
        upazila = details.upazila or ""
        district = details.district or ""
        gpa = details.gpa or 5.00
        dob = details.date_of_birth
        exam_year = details.year or timezone.now().year
        serial_no = details.serial_number or ""
    else:
        # Fallback to student data
        roll = student.roll_number or ""
        registration_no = student.registration or ""
        session = student.session or (student.student_class.session if student.student_class else "")
        name_bn = student.bangla_name or ""
        name_en = student.user.get_full_name() or ""
        father_bn = student.fathers_name or ""
        mother_bn = student.mothers_name or ""
        village = student.village or ""
        post_office = student.post_office or ""
        upazila = student.upazilla_thana or ""
        district = student.district or ""
        gpa = 5.00
        dob = student.date_of_birth
        exam_year = timezone.now().year
        serial_no = ""
    
    return {
        "serial_no": _bn_digits(serial_no) if serial_no else "",
        "issue_date": _bn_date(issue_date),
        "roll": _bn_digits(roll) if roll else "",
        "registration_no": _bn_digits(registration_no) if registration_no else "",
        "session": _bn_digits(session) if session else "",
        "name_bn": name_bn,
        "name_en": name_en,
        "father_bn": father_bn,
        "mother_bn": mother_bn,
        "village": village,
        "post_office": post_office,
        "upazila": upazila,
        "district": district,
        "exam_year": _bn_digits(exam_year),
        "gpa": _bn_digits(f"{gpa:.2f}"),
        "dob_numeric": _bn_date(dob) if dob else "",
        "dob_words": _bn_date_words(dob) if dob else "",
    }


def generate_testimonial_pdf(testimonial_request) -> Tuple[str, bytes]:
    """
    Generate testimonial PDF (প্রশংসা পত্র) using HTML template and WeasyPrint.
    Generates a landscape page with two forms: Left (Template) and Right (Filled).
    
    Args:
        testimonial_request: TestimonialRequest object with approved details
    """
    AdmissionFormTemplate.get_default()

    # Font paths
    font_path = os.path.join(FONTS_DIR, "Nikosh.ttf")
    font_bold_path = os.path.join(FONTS_DIR, "NikoshBAN.ttf")

    # Contexts
    try:
        # Left form is template, right form is filled
        left_form = get_student_context(testimonial_request, is_template=True)
        right_form = get_student_context(testimonial_request, is_template=False)
        
        context = {
            "font_path": font_path,
            "font_bold_path": font_bold_path,
            "form": right_form  # Pass filled data as 'form'
        }
        
        html_string = render_to_string('transcripts/testimonial.html', context)
        
        pdf_file = HTML(string=html_string, base_url=settings.BASE_DIR).write_pdf()
        
        student = testimonial_request.student
        name_en_first = student.user.first_name or "student"
        filename = f"testimonial-{name_en_first}.pdf"
        
        return filename, pdf_file
        
    except Exception as e:
        # Fallback to empty byte if generation fails (though it shouldn't)
        print(f"PDF Generation Error: {e}")
        return "error.pdf", b""

def _register_bengali_fonts() -> Tuple[str, str]:
    # Kept for backward compatibility if imported elsewhere
    return "Nikosh", "NikoshBAN"

def generate_marksheet_pdf(student, exam_title, class_name, marks_qs) -> Tuple[str, bytes]:
    AdmissionFormTemplate.get_default()
    font_path = os.path.join(FONTS_DIR, "Nikosh.ttf")
    font_bold_path = os.path.join(FONTS_DIR, "NikoshBAN.ttf")

    context = {
        "student": student,
        "exam_title": exam_title,
        "class_name": class_name,
        "marks": marks_qs,
        "font_path": font_path,
        "font_bold_path": font_bold_path,
        "issue_date": timezone.localdate(),
    }
    
    html_string = render_to_string('transcripts/marksheet.html', context)
    pdf_file = HTML(string=html_string, base_url=settings.BASE_DIR).write_pdf()
    
    filename = f"marksheet-{student.user.username}.pdf"
    return filename, pdf_file


def generate_exam_routine_pdf(exam_title, class_name, schedules) -> Tuple[str, bytes]:
    font_path = os.path.join(FONTS_DIR, "Nikosh.ttf")
    font_bold_path = os.path.join(FONTS_DIR, "NikoshBAN.ttf")
    
    context = {
        "exam_title": exam_title,
        "class_name": class_name,
        "schedules": schedules,
        "font_path": font_path,
        "font_bold_path": font_bold_path,
    }
    
    html_string = render_to_string('transcripts/routine.html', context)
    pdf_file = HTML(string=html_string, base_url=settings.BASE_DIR).write_pdf()
    return f"routine-{class_name}.pdf", pdf_file


def generate_exam_admit_card_pdf(student, exam_title, schedules) -> Tuple[str, bytes]:
    font_path = os.path.join(FONTS_DIR, "Nikosh.ttf")
    font_bold_path = os.path.join(FONTS_DIR, "NikoshBAN.ttf")
    
    context = {
        "student": student,
        "exam_title": exam_title,
        "class_name": str(student.student_class),
        "schedules": schedules,
        "font_path": font_path,
        "font_bold_path": font_bold_path,
    }
    
    html_string = render_to_string('transcripts/admit_card.html', context)
    pdf_file = HTML(string=html_string, base_url=settings.BASE_DIR).write_pdf()
    return f"admit-card-{student.user.username}.pdf", pdf_file
