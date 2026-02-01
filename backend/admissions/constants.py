DEFAULT_FIELD_SPECS = [
    # Personal Information
    {"name": "first_name", "label": "Applicant's First Name", "source": "user.first_name", "multiline": False, "visible": True},
    {"name": "last_name", "label": "Applicant's Last Name", "source": "user.last_name", "multiline": False, "visible": True},
    {"name": "date_of_birth", "label": "Date of Birth", "source": "date_of_birth", "multiline": False, "visible": True},
    {"name": "birth_registration_number", "label": "Birth Registration Number", "source": "birth_registration_number", "multiline": False, "visible": True},
    {"name": "gender", "label": "Gender", "source": "gender", "multiline": False, "visible": True},
    {"name": "religion", "label": "Religion", "source": "religion", "multiline": False, "visible": True},
    {"name": "nationality", "label": "Nationality", "source": "nationality", "multiline": False, "visible": True},
    
    # Contact Information
    {"name": "email", "label": "Email Address", "source": "user.email", "multiline": False, "visible": True},
    {"name": "phone", "label": "Mobile Number", "source": "user.phone", "multiline": False, "visible": True},
    
    # Address Information
    {"name": "address", "label": "Present Address", "source": "address", "multiline": True, "visible": True},
    {"name": "permanent_address", "label": "Permanent Address", "source": "permanent_address", "multiline": True, "visible": True},
    {"name": "post_code", "label": "Post Code", "source": "post_code", "multiline": False, "visible": True},
    {"name": "upazilla_thana", "label": "Upazilla/Thana", "source": "upazilla_thana", "multiline": False, "visible": True},
    {"name": "district", "label": "District", "source": "district", "multiline": False, "visible": True},
    
    # Family Information
    {"name": "fathers_name", "label": "Father's Name", "source": "fathers_name", "multiline": False, "visible": True},
    {"name": "fathers_nid", "label": "Father's NID", "source": "fathers_nid", "multiline": False, "visible": True},
    {"name": "mothers_name", "label": "Mother's Name", "source": "mothers_name", "multiline": False, "visible": True},
    {"name": "mothers_nid", "label": "Mother's NID", "source": "mothers_nid", "multiline": False, "visible": True},
    {"name": "guardian_name", "label": "Legal Guardian", "source": "guardian_name", "multiline": False, "visible": True},
    {"name": "guardian_phone", "label": "Guardian's Phone", "source": "guardian_phone", "multiline": False, "visible": True},
    {"name": "guardian_monthly_income", "label": "Guardian's Monthly Income", "source": "guardian_monthly_income", "multiline": False, "visible": True},
    
    # Academic History (SSC/Equivalent)
    {"name": "ssc_board", "label": "SSC Board", "source": "ssc_board", "multiline": False, "visible": True},
    {"name": "ssc_registration_no", "label": "SSC Registration No.", "source": "ssc_registration_no", "multiline": False, "visible": True},
    {"name": "ssc_group", "label": "SSC Group", "source": "ssc_group", "multiline": False, "visible": True},
    {"name": "ssc_roll_number", "label": "SSC Roll Number", "source": "ssc_roll_number", "multiline": False, "visible": True},
    {"name": "ssc_year_of_passing", "label": "SSC Year of Passing", "source": "ssc_year_of_passing", "multiline": False, "visible": True},
    {"name": "ssc_gpa", "label": "SSC GPA", "source": "ssc_gpa", "multiline": False, "visible": True},
    
    # Class Information
    {"name": "student_class", "label": "Class Applying For", "source": "student_class", "multiline": False, "visible": True},
    {"name": "registration_id", "label": "Registration ID", "source": "registration_id", "multiline": False, "visible": True},
    {"name": "submission_date", "label": "Submission Date", "source": "submission_date", "multiline": False, "visible": True},
]

FIELD_SPEC_BY_NAME = {field["name"]: field for field in DEFAULT_FIELD_SPECS}
