import json
import uuid
from decimal import Decimal, InvalidOperation
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse
from urllib.request import Request, urlopen

from django.conf import settings
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from users.models import Student
from .constants import DEFAULT_FIELD_SPECS
from .models import AdmissionFormTemplate, AdmissionFormSubmission, AdmissionPaymentIntent
from .permissions import IsAdminOrReadOnly
from .serializers import AdmissionFormSubmissionSerializer, AdmissionFormTemplateSerializer
from .services import generate_admission_form_pdf, resolve_registration_download_token


def _sslcommerz_base_url():
    return "https://sandbox.sslcommerz.com" if settings.SSLCOMMERZ_SANDBOX else "https://securepay.sslcommerz.com"


def _sslcommerz_init_url():
    return f"{_sslcommerz_base_url()}/gwprocess/v4/api.php"


def _sslcommerz_validation_url():
    return f"{_sslcommerz_base_url()}/validator/api/validationserverAPI.php"


def _append_query_param(url: str, params: dict) -> str:
    parts = urlparse(url)
    query = dict(parse_qsl(parts.query))
    query.update({k: v for k, v in params.items() if v is not None})
    return urlunparse(parts._replace(query=urlencode(query)))


def _build_return_url(request, result: str) -> str:
    base_url = request.build_absolute_uri("/api/admissions/sslcommerz/return/")
    return _append_query_param(base_url, {"result": result, "source": "admission"})


def _validate_submission_payment(submission: AdmissionFormSubmission, val_id: str) -> dict:
    validation_params = {
        "val_id": val_id,
        "store_id": settings.SSLCOMMERZ_STORE_ID,
        "store_passwd": settings.SSLCOMMERZ_STORE_PASSWORD,
        "format": "json",
    }

    url = f"{_sslcommerz_validation_url()}?{urlencode(validation_params)}"
    with urlopen(url, timeout=30) as response:
        validation_raw = response.read().decode("utf-8")
    validation_data = json.loads(validation_raw)

    submission.gateway_payload = submission.gateway_payload or {}
    submission.gateway_payload["validation"] = validation_data
    submission.save(update_fields=["gateway_payload"])

    try:
        amount = Decimal(str(validation_data.get("amount")))
    except (InvalidOperation, TypeError):
        amount = None

    if validation_data.get("status") in ["VALID", "VALIDATED"] and amount == submission.amount:
        submission.status = "paid"
        submission.paid_at = timezone.now()
        submission.save(update_fields=["status", "paid_at"])

    return validation_data


def _validate_intent_payment(intent: AdmissionPaymentIntent, val_id: str) -> tuple[dict, AdmissionFormSubmission | None]:
    validation_params = {
        "val_id": val_id,
        "store_id": settings.SSLCOMMERZ_STORE_ID,
        "store_passwd": settings.SSLCOMMERZ_STORE_PASSWORD,
        "format": "json",
    }

    url = f"{_sslcommerz_validation_url()}?{urlencode(validation_params)}"
    with urlopen(url, timeout=30) as response:
        validation_raw = response.read().decode("utf-8")
    validation_data = json.loads(validation_raw)

    intent.gateway_payload = intent.gateway_payload or {}
    intent.gateway_payload["validation"] = validation_data
    intent.save(update_fields=["gateway_payload"])

    try:
        amount = Decimal(str(validation_data.get("amount")))
    except (InvalidOperation, TypeError):
        amount = None

    if validation_data.get("status") in ["VALID", "VALIDATED"] and amount == intent.amount:
        intent.status = "paid"
        intent.paid_at = timezone.now()
        intent.save(update_fields=["status", "paid_at"])

        submission, _ = AdmissionFormSubmission.objects.get_or_create(
            transaction_id=intent.transaction_id,
            defaults={
                "template": intent.template,
                "form_data": intent.form_data,
                "amount": intent.amount,
                "status": "paid",
                "paid_at": intent.paid_at,
            },
        )
        return validation_data, submission

    return validation_data, None


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


class AdmissionFormSubmissionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AdmissionFormSubmissionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, "role", None) != "admin":
            return AdmissionFormSubmission.objects.none()
        return AdmissionFormSubmission.objects.select_related("template").filter(status="paid")

    @action(detail=True, methods=["get"])
    def download(self, request, pk=None):
        if getattr(request.user, "role", None) != "admin":
            return Response({"detail": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)
        submission = self.get_object()
        filename, pdf_bytes = generate_admission_form_pdf(
            template=submission.template,
            form_data=submission.form_data,
        )
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


class AdmissionFormInitView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        template_slug = request.data.get("template_slug")
        if template_slug:
            template = get_object_or_404(AdmissionFormTemplate, slug=template_slug)
        else:
            template = AdmissionFormTemplate.get_default()
        if not template:
            return Response({"detail": "No admission form template configured."}, status=status.HTTP_404_NOT_FOUND)

        form_data = request.data.get("form_data")
        if isinstance(form_data, str):
            try:
                form_data = json.loads(form_data)
            except json.JSONDecodeError:
                form_data = None
        if not isinstance(form_data, dict):
            return Response({"detail": "form_data is required."}, status=status.HTTP_400_BAD_REQUEST)

        if not settings.SSLCOMMERZ_STORE_ID or not settings.SSLCOMMERZ_STORE_PASSWORD:
            return Response({"detail": "Payment gateway not configured."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        try:
            amount = Decimal(str(settings.ADMISSION_FORM_FEE_AMOUNT))
        except (InvalidOperation, TypeError):
            return Response({"detail": "Admission fee amount is invalid."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        tran_id = f"ADM-{uuid.uuid4().hex[:12].upper()}"
        intent = AdmissionPaymentIntent.objects.create(
            template=template,
            form_data=form_data,
            amount=amount,
            transaction_id=tran_id,
            status="pending",
        )

        customer_name = f"{form_data.get('first_name', '')} {form_data.get('last_name', '')}".strip() or "Admission Applicant"
        post_data = {
            "store_id": settings.SSLCOMMERZ_STORE_ID,
            "store_passwd": settings.SSLCOMMERZ_STORE_PASSWORD,
            "total_amount": str(amount),
            "currency": settings.SSLCOMMERZ_CURRENCY,
            "tran_id": tran_id,
            "success_url": _build_return_url(request, "success"),
            "fail_url": _build_return_url(request, "fail"),
            "cancel_url": _build_return_url(request, "cancel"),
            "ipn_url": settings.SSLCOMMERZ_ADMISSION_IPN_URL,
            "product_category": "education",
            "product_name": "Admission Form",
            "product_profile": "non-physical-goods",
            "cus_name": customer_name,
            "cus_email": form_data.get("email") or "N/A",
            "cus_add1": form_data.get("address") or "N/A",
            "cus_city": "N/A",
            "cus_postcode": "0000",
            "cus_country": "Bangladesh",
            "cus_phone": form_data.get("phone") or form_data.get("guardian_phone") or "N/A",
            "shipping_method": "NO",
            "num_of_item": 1,
            "weight_of_items": "0.1",
            "value_a": str(intent.id),
        }

        try:
            data = urlencode(post_data).encode("utf-8")
            req = Request(_sslcommerz_init_url(), data=data, method="POST")
            req.add_header("Content-Type", "application/x-www-form-urlencoded")
            with urlopen(req, timeout=30) as response:
                raw = response.read().decode("utf-8")
            ssl_response = json.loads(raw)
        except Exception as exc:
            intent.gateway_payload = {"error": str(exc)}
            intent.status = "failed"
            intent.save(update_fields=["gateway_payload", "status"])
            return Response({"status": "fail", "message": "Failed to connect with SSLCOMMERZ"}, status=status.HTTP_502_BAD_GATEWAY)

        intent.gateway_payload = {"init_response": ssl_response}
        intent.save(update_fields=["gateway_payload"])

        gateway_url = ssl_response.get("GatewayPageURL")
        if gateway_url:
            return Response({
                "status": "success",
                "data": gateway_url,
                "tran_id": tran_id,
                "intent_id": intent.id,
            })

        intent.status = "failed"
        intent.save(update_fields=["status"])
        return Response({"status": "fail", "message": ssl_response.get("failedreason") or "Gateway error"}, status=status.HTTP_400_BAD_REQUEST)


class AdmissionFormIPNView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data
        tran_id = data.get("tran_id")
        status_value = data.get("status")
        val_id = data.get("val_id")

        if not tran_id:
            return Response("Missing transaction ID", status=status.HTTP_400_BAD_REQUEST)

        intent = AdmissionPaymentIntent.objects.filter(transaction_id=tran_id).first()
        if not intent:
            return Response("Intent not found", status=status.HTTP_404_NOT_FOUND)

        intent.gateway_payload = intent.gateway_payload or {}
        intent.gateway_payload["ipn"] = data
        intent.save(update_fields=["gateway_payload"])

        if status_value not in ["VALID", "VALIDATED"]:
            intent.status = "failed"
            intent.save(update_fields=["status"])
            return Response("IPN received")

        if not val_id:
            return Response("Missing val_id", status=status.HTTP_400_BAD_REQUEST)

        try:
            _validate_intent_payment(intent, val_id)
        except Exception as exc:
            intent.gateway_payload = intent.gateway_payload or {}
            intent.gateway_payload["validation_error"] = str(exc)
            intent.save(update_fields=["gateway_payload"])
            return Response("Validation failed", status=status.HTTP_502_BAD_GATEWAY)

        return Response("Payment validated")


class AdmissionReturnView(APIView):
    permission_classes = [AllowAny]

    def _handle(self, request):
        data = request.data if request.method == "POST" else request.query_params
        tran_id = data.get("tran_id")
        status_value = data.get("status")
        val_id = data.get("val_id")
        intent = AdmissionPaymentIntent.objects.filter(transaction_id=tran_id).first() if tran_id else None
        result = "failed"

        if status_value in ["VALID", "VALIDATED"] and val_id and intent:
            try:
                _, submission = _validate_intent_payment(intent, val_id)
                if submission and submission.status == "paid":
                    result = "success"
            except Exception:
                result = "failed"

        if intent and result != "success" and intent.status == "pending":
            intent.status = "failed"
            intent.save(update_fields=["status"])

        frontend_url = f"{settings.FRONTEND_BASE_URL.rstrip('/')}/admission"
        redirect_url = _append_query_param(
            frontend_url,
            {
                "payment": result,
                "source": "admission",
                "tran_id": tran_id,
                "val_id": val_id,
            },
        )
        return HttpResponseRedirect(redirect_url)

    def post(self, request, *args, **kwargs):
        return self._handle(request)

    def get(self, request, *args, **kwargs):
        return self._handle(request)


class AdmissionFormDownloadView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        tran_id = request.query_params.get("tran_id")
        val_id = request.query_params.get("val_id")

        if not tran_id:
            return Response({"detail": "tran_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        submission = AdmissionFormSubmission.objects.filter(transaction_id=tran_id).select_related("template").first()
        if not submission:
            intent = AdmissionPaymentIntent.objects.filter(transaction_id=tran_id).select_related("template").first()
            if not intent:
                return Response({"detail": "Submission not found."}, status=status.HTTP_404_NOT_FOUND)
            if not val_id:
                return Response({"detail": "Payment not confirmed yet."}, status=status.HTTP_409_CONFLICT)
            try:
                _, submission = _validate_intent_payment(intent, val_id)
            except Exception as exc:
                intent.gateway_payload = intent.gateway_payload or {}
                intent.gateway_payload["validation_error"] = str(exc)
                intent.save(update_fields=["gateway_payload"])
                return Response({"detail": "Payment validation failed."}, status=status.HTTP_502_BAD_GATEWAY)
            if not submission or submission.status != "paid":
                return Response({"detail": "Payment not completed yet."}, status=status.HTTP_409_CONFLICT)

        if submission.status != "paid":
            if not val_id:
                return Response({"detail": "Payment not confirmed yet."}, status=status.HTTP_409_CONFLICT)
            try:
                _validate_submission_payment(submission, val_id)
            except Exception as exc:
                submission.gateway_payload = submission.gateway_payload or {}
                submission.gateway_payload["validation_error"] = str(exc)
                submission.save(update_fields=["gateway_payload"])
                return Response({"detail": "Payment validation failed."}, status=status.HTTP_502_BAD_GATEWAY)

        if submission.status != "paid":
            return Response({"detail": "Payment not completed yet."}, status=status.HTTP_409_CONFLICT)

        filename, pdf_bytes = generate_admission_form_pdf(
            template=submission.template,
            form_data=submission.form_data,
        )
        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        response["Content-Length"] = len(pdf_bytes)
        return response
