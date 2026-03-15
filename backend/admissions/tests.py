import json
from unittest.mock import patch

from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient

from academics.models import Subject
from admissions.models import AdmissionFormTemplate, AdmissionPaymentIntent
from classes.models import Class
from users.models import Student, User


class _MockGatewayResponse:
    def __init__(self, payload):
        self._payload = payload

    def read(self):
        return json.dumps(self._payload).encode("utf-8")

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False


@override_settings(
    SSLCOMMERZ_STORE_ID="test_store",
    SSLCOMMERZ_STORE_PASSWORD="test_password",
)
class AdmissionPaymentInitTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.class_obj = Class.objects.create(name="Eleven", section="A", session="2025-2026")
        self.subject_1 = Subject.objects.create(name="Biology", code="BIO", class_assigned=self.class_obj)
        self.subject_2 = Subject.objects.create(name="Chemistry", code="CHE", class_assigned=self.class_obj)
        self.subject_3 = Subject.objects.create(name="Physics", code="PHY", class_assigned=self.class_obj)

        self.user = User.objects.create_user(
            username="student.one",
            email="student1@example.com",
            password="pass1234",
            role="student",
            first_name="Student",
            last_name="One",
            status="approved",
        )
        self.student = Student.objects.create(
            user=self.user,
            student_class=self.class_obj,
            roll_number="11A-01",
            guardian_name="Guardian",
            guardian_phone="01700000000",
        )
        self.client.force_authenticate(self.user)

        self.template = AdmissionFormTemplate.objects.create(
            name="Test Template",
            slug="test-template",
            school_name="Test School",
            is_default=True,
            layout_metadata={},
        )

    @patch("admissions.views.urlopen")
    def test_init_accepts_all_selection_with_empty_subject_list(self, mock_urlopen):
        mock_urlopen.return_value = _MockGatewayResponse(
            {"GatewayPageURL": "https://gateway.example/session"}
        )

        response = self.client.post(
            "/api/admissions/sslcommerz/init/",
            {"subject_selection": "all", "selected_subjects": []},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get("status"), "success")

        intent = AdmissionPaymentIntent.objects.get(id=response.data["intent_id"])
        selected = intent.form_data.get("selected_subjects") or []
        self.assertEqual(len(selected), 3)

    def test_init_rejects_invalid_subject_ids(self):
        response = self.client.post(
            "/api/admissions/sslcommerz/init/",
            {"subject_selection": "one", "selected_subjects": [999999]},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data.get("detail"), "Selected subjects are invalid.")

    def test_init_rejects_subject_count_mismatch(self):
        response = self.client.post(
            "/api/admissions/sslcommerz/init/",
            {"subject_selection": "two", "selected_subjects": [self.subject_1.id]},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data.get("detail"), "Please select 2 subject(s).")

    def test_init_requires_student_class(self):
        self.student.student_class = None
        self.student.save(update_fields=["student_class"])

        response = self.client.post(
            "/api/admissions/sslcommerz/init/",
            {"subject_selection": "all", "selected_subjects": []},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data.get("detail"), "Student class not assigned.")
