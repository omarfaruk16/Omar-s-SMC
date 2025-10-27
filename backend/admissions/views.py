from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from users.models import Student
from .constants import DEFAULT_FIELD_SPECS
from .models import AdmissionFormTemplate
from .permissions import IsAdminOrReadOnly
from .serializers import AdmissionFormTemplateSerializer
from .services import generate_admission_form_pdf, resolve_registration_download_token


class AdmissionFormTemplateViewSet(viewsets.ModelViewSet):
    """Admission form templates with public read access and admin management."""

    queryset = AdmissionFormTemplate.objects.all()
    serializer_class = AdmissionFormTemplateSerializer
    permission_classes = [IsAdminOrReadOnly]
    lookup_field = "slug"

    def get_queryset(self):
        AdmissionFormTemplate.ensure_default_exists()
        return AdmissionFormTemplate.objects.all()

    def get_permissions(self):
        if self.action in {"list", "retrieve", "default_template", "blank_pdf"}:
            return [AllowAny()]
        if self.action in {"student_filled_pdf", "available_fields"}:
            return [IsAuthenticated()]
        return [IsAdminOrReadOnly()]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    @action(detail=False, methods=["get"], url_path="default")
    def default_template(self, request):
        template = AdmissionFormTemplate.get_default()
        if not template:
            return Response(
                {"detail": "No admission form template configured."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = self.get_serializer(template)
        return Response(serializer.data)

    @action(detail=True, methods=["get"], url_path="blank", permission_classes=[AllowAny])
    def blank_pdf(self, request, slug=None):
        template = self.get_object()
        filename, pdf_bytes = generate_admission_form_pdf(template=template)
        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        response["Content-Length"] = len(pdf_bytes)
        return response

    @action(
        detail=False,
        methods=["get"],
        url_path="available-fields",
    )
    def available_fields(self, request):
        if not request.user.is_authenticated or getattr(request.user, "role", None) != "admin":
            return Response({"detail": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)
        return Response({"fields": DEFAULT_FIELD_SPECS})

    @action(
        detail=True,
        methods=["get"],
        url_path=r"students/(?P<student_id>\d+)/filled",
        permission_classes=[IsAuthenticated],
    )
    def student_filled_pdf(self, request, slug=None, student_id=None):
        template = self.get_object()
        student = get_object_or_404(Student, pk=student_id)

        user = request.user
        if not (
            user.role == "admin"
            or (hasattr(user, "student_profile") and user.student_profile.pk == student.pk)
        ):
            return Response(
                {"detail": "You do not have permission to access this student's form."},
                status=status.HTTP_403_FORBIDDEN,
            )

        filename, pdf_bytes = generate_admission_form_pdf(template=template, student=student)
        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        response["Content-Length"] = len(pdf_bytes)
        return response


class RegistrationAdmissionFormDownloadView(APIView):
    """Provide a one-time download link for newly registered students."""

    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        token = request.query_params.get("token")
        if not token:
            return Response({"detail": "Token is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            student_id = resolve_registration_download_token(token)
        except ValueError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        student = get_object_or_404(Student, pk=student_id)
        template = AdmissionFormTemplate.get_default()
        if not template:
            return Response(
                {"detail": "No admission form template configured."},
                status=status.HTTP_404_NOT_FOUND,
            )

        filename, pdf_bytes = generate_admission_form_pdf(template=template, student=student)
        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        response["Content-Length"] = len(pdf_bytes)
        return response
