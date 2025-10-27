DEFAULT_FIELD_SPECS = [
    {"name": "first_name", "label": "First Name", "source": "user.first_name", "multiline": False, "visible": True},
    {"name": "last_name", "label": "Last Name", "source": "user.last_name", "multiline": False, "visible": True},
    {"name": "email", "label": "Email Address", "source": "user.email", "multiline": False, "visible": True},
    {"name": "phone", "label": "Phone Number", "source": "user.phone", "multiline": False, "visible": True},
    {"name": "date_of_birth", "label": "Date of Birth", "source": "date_of_birth", "multiline": False, "visible": True},
    {"name": "student_class", "label": "Preferred / Assigned Class", "source": "student_class", "multiline": False, "visible": True},
    {"name": "address", "label": "Present Address", "source": "address", "multiline": True, "visible": True},
    {"name": "guardian_name", "label": "Guardian Name", "source": "guardian_name", "multiline": False, "visible": True},
    {"name": "guardian_phone", "label": "Guardian Contact No.", "source": "guardian_phone", "multiline": False, "visible": True},
    {"name": "registration_id", "label": "Registration ID", "source": "registration_id", "multiline": False, "visible": True},
    {"name": "submission_date", "label": "Submission Date", "source": "submission_date", "multiline": False, "visible": True},
]

FIELD_SPEC_BY_NAME = {field["name"]: field for field in DEFAULT_FIELD_SPECS}
