import json
import uuid
import random
from decimal import Decimal, InvalidOperation
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse
from urllib.request import Request, urlopen

from django.conf import settings
from django.http import HttpResponse, HttpResponseRedirect
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import AccessToken

from .models import TestimonialPayment, TestimonialRequest, TestimonialDetails
from .serializers import TestimonialRequestSerializer, TestimonialDetailsSerializer
from .services import generate_testimonial_pdf

User = get_user_model()


def _sslcommerz_base_url():
    return 'https://sandbox.sslcommerz.com' if settings.SSLCOMMERZ_SANDBOX else 'https://securepay.sslcommerz.com'


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
    base_url = request.build_absolute_uri("/api/testimonials/sslcommerz/return/")
    return _append_query_param(base_url, {"result": result, "source": "testimonial"})


def _get_user_from_token(token):
    if not token:
        return None
    try:
        access = AccessToken(token)
        user_id = access.get('user_id')
        if not user_id:
            return None
        return User.objects.filter(id=user_id).first()
    except Exception:
        return None


def _sync_testimonial_request(payment: TestimonialPayment, note: str = '') -> None:
    if payment.status not in {'paid', 'failed'}:
        return
    TestimonialRequest.objects.update_or_create(
        payment=payment,
        defaults={
            'student': payment.student,
            'status': 'pending' if payment.status == 'paid' else payment.status,  # Set to pending for admin approval
            'note': note,
            'requested_at': payment.paid_at or timezone.now(),
        },
    )


class TestimonialRequestViewSet(viewsets.ModelViewSet):
    serializer_class = TestimonialRequestSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'delete', 'head', 'options']

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return TestimonialRequest.objects.all().select_related('student__user', 'payment', 'details')
        if user.role == 'student':
            try:
                student = user.student_profile
            except Exception:
                return TestimonialRequest.objects.none()
            return TestimonialRequest.objects.filter(student=student).select_related('student__user', 'payment', 'details')
        return TestimonialRequest.objects.none()
    
    def destroy(self, request, *args, **kwargs):
        """Only allow admin to delete testimonial requests"""
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        testimonial = self.get_object()
        if request.user.role == 'student':
            try:
                if testimonial.student != request.user.student_profile:
                    return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
            except Exception:
                return Response({'error': 'Student profile not found'}, status=status.HTTP_404_NOT_FOUND)

        # Only approved testimonials can be downloaded
        if testimonial.status != 'approved':
            return Response({'error': 'Testimonial is not approved yet'}, status=status.HTTP_403_FORBIDDEN)

        # Check if details exist
        if not hasattr(testimonial, 'details'):
            return Response({'error': 'Testimonial details not found'}, status=status.HTTP_404_NOT_FOUND)

        filename, pdf_bytes = generate_testimonial_pdf(testimonial)
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def approve(self, request, pk=None):
        """Approve a testimonial request with editable details"""
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)

        testimonial = self.get_object()
        
        if testimonial.status == 'approved':
            return Response({'error': 'Testimonial already approved'}, status=status.HTTP_400_BAD_REQUEST)

        # Generate unique serial number (minimum 5 digits)
        serial_number = str(random.randint(10000, 999999))
        while TestimonialDetails.objects.filter(serial_number=serial_number).exists():
            serial_number = str(random.randint(10000, 999999))

        # Prepare default data from student
        student = testimonial.student
        default_data = {
            'bangla_name': student.bangla_name or '',
            'name': student.user.get_full_name() or '',
            'roll_number': student.roll_number or '',
            'registration': student.registration or '',
            'session': student.session or (student.student_class.session if student.student_class else ''),
            'father_bn': student.fathers_name or '',
            'mother_bn': student.mothers_name or '',
            'village': student.village or '',
            'post_office': student.post_office or '',
            'upazila': student.upazilla_thana or '',
            'district': student.district or '',
            'gpa': request.data.get('gpa', 5.00),
            'date_of_birth': request.data.get('date_of_birth') or student.date_of_birth,
            'year': request.data.get('year') or timezone.now().year,
            'serial_number': serial_number,
        }

        # Override with request data
        for key in default_data.keys():
            if key in request.data and request.data[key] is not None:
                default_data[key] = request.data[key]

        # Create or update testimonial details
        details, created = TestimonialDetails.objects.update_or_create(
            testimonial_request=testimonial,
            defaults=default_data
        )

        # Update testimonial status
        testimonial.status = 'approved'
        testimonial.processed_at = timezone.now()
        testimonial.save(update_fields=['status', 'processed_at'])

        serializer = self.get_serializer(testimonial)
        return Response({
            'message': 'Testimonial approved successfully',
            'testimonial': serializer.data
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def reject(self, request, pk=None):
        """Reject a testimonial request with a reason"""
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)

        testimonial = self.get_object()
        
        if testimonial.status == 'approved':
            return Response({'error': 'Cannot reject an approved testimonial'}, status=status.HTTP_400_BAD_REQUEST)

        rejection_reason = request.data.get('rejection_reason')
        if not rejection_reason:
            return Response({'error': 'Rejection reason is required'}, status=status.HTTP_400_BAD_REQUEST)

        testimonial.status = 'rejected'
        testimonial.rejection_reason = rejection_reason
        testimonial.processed_at = timezone.now()
        testimonial.save(update_fields=['status', 'rejection_reason', 'processed_at'])

        serializer = self.get_serializer(testimonial)
        return Response({
            'message': 'Testimonial rejected',
            'testimonial': serializer.data
        }, status=status.HTTP_200_OK)


class TestimonialInitView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        user = request.user if request.user.is_authenticated else None
        if not user:
            token = request.data.get('token')
            user = _get_user_from_token(token)
        if not user or user.role != 'student':
            return Response({'error': 'Student access required'}, status=status.HTTP_403_FORBIDDEN)

        if not settings.SSLCOMMERZ_STORE_ID or not settings.SSLCOMMERZ_STORE_PASSWORD:
            return Response({'error': 'Payment gateway not configured'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        try:
            student = user.student_profile
        except Exception:
            return Response({'error': 'Student profile not found'}, status=status.HTTP_404_NOT_FOUND)

        try:
            amount = Decimal(str(settings.TESTIMONIAL_FEE_AMOUNT))
        except (InvalidOperation, TypeError):
            return Response({'error': 'Testimonial fee amount is invalid'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Get note from request data
        note = request.data.get('note', '')

        tran_id = f"TRX-{uuid.uuid4().hex[:12].upper()}"
        payment = TestimonialPayment.objects.create(
            student=student,
            amount=amount,
            transaction_id=tran_id,
            status='pending',
            gateway_payload={'note': note},  # Store note in gateway_payload
            created_at=timezone.now(),
        )

        customer_name = user.get_full_name() or user.email
        post_data = {
            'store_id': settings.SSLCOMMERZ_STORE_ID,
            'store_passwd': settings.SSLCOMMERZ_STORE_PASSWORD,
            'total_amount': str(amount),
            'currency': settings.SSLCOMMERZ_CURRENCY,
            'tran_id': tran_id,
            'success_url': _build_return_url(request, 'success'),
            'fail_url': _build_return_url(request, 'fail'),
            'cancel_url': _build_return_url(request, 'cancel'),
            'ipn_url': settings.SSLCOMMERZ_TESTIMONIAL_IPN_URL,
            'product_category': 'education',
            'product_name': 'Testimonial Request',
            'product_profile': 'non-physical-goods',
            'cus_name': customer_name,
            'cus_email': user.email,
            'cus_add1': 'N/A',
            'cus_city': 'N/A',
            'cus_postcode': '0000',
            'cus_country': 'Bangladesh',
            'cus_phone': user.phone or 'N/A',
            'shipping_method': 'NO',
            'num_of_item': 1,
            'weight_of_items': '0.1',
            'value_a': str(payment.id),
        }

        try:
            data = urlencode(post_data).encode('utf-8')
            req = Request(_sslcommerz_init_url(), data=data, method='POST')
            req.add_header('Content-Type', 'application/x-www-form-urlencoded')
            with urlopen(req, timeout=30) as response:
                raw = response.read().decode('utf-8')
            ssl_response = json.loads(raw)
        except Exception as exc:
            note = payment.gateway_payload.get('note', '') if payment.gateway_payload else ''
            payment.gateway_payload = payment.gateway_payload or {}
            payment.gateway_payload['error'] = str(exc)
            payment.status = 'failed'
            payment.save(update_fields=['gateway_payload', 'status'])
            _sync_testimonial_request(payment, note)
            return Response({'status': 'fail', 'message': 'Failed to connect with SSLCOMMERZ'}, status=status.HTTP_502_BAD_GATEWAY)

        note = payment.gateway_payload.get('note', '') if payment.gateway_payload else ''
        payment.gateway_payload = payment.gateway_payload or {}
        payment.gateway_payload['init_response'] = ssl_response
        payment.save(update_fields=['gateway_payload'])

        gateway_url = ssl_response.get('GatewayPageURL')
        if gateway_url:
            return Response({'status': 'success', 'data': gateway_url, 'logo': ssl_response.get('storeLogo')})

        payment.status = 'failed'
        payment.save(update_fields=['status'])
        _sync_testimonial_request(payment, note)
        return Response({'status': 'fail', 'message': ssl_response.get('failedreason') or 'Gateway error'}, status=status.HTTP_400_BAD_REQUEST)


class TestimonialIPNView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data
        tran_id = data.get('tran_id')
        status_value = data.get('status')
        val_id = data.get('val_id')

        if not tran_id:
            return Response('Missing transaction ID', status=status.HTTP_400_BAD_REQUEST)

        payment = TestimonialPayment.objects.filter(transaction_id=tran_id).first()
        if not payment:
            return Response('Payment not found', status=status.HTTP_404_NOT_FOUND)

        payment.gateway_payload = payment.gateway_payload or {}
        payment.gateway_payload['ipn'] = data
        payment.save(update_fields=['gateway_payload'])

        if status_value not in ['VALID', 'VALIDATED']:
            payment.status = 'failed'
            payment.save(update_fields=['status'])
            note = payment.gateway_payload.get('note', '') if payment.gateway_payload else ''
            _sync_testimonial_request(payment, note)
            return Response('IPN received')

        if not val_id:
            return Response('Missing val_id', status=status.HTTP_400_BAD_REQUEST)

        validation_params = {
            'val_id': val_id,
            'store_id': settings.SSLCOMMERZ_STORE_ID,
            'store_passwd': settings.SSLCOMMERZ_STORE_PASSWORD,
            'format': 'json',
        }

        try:
            url = f"{_sslcommerz_validation_url()}?{urlencode(validation_params)}"
            with urlopen(url, timeout=30) as response:
                validation_raw = response.read().decode('utf-8')
            validation_data = json.loads(validation_raw)
        except Exception as exc:
            payment.gateway_payload['validation_error'] = str(exc)
            payment.save(update_fields=['gateway_payload'])
            return Response('Validation failed', status=status.HTTP_502_BAD_GATEWAY)

        payment.gateway_payload['validation'] = validation_data
        payment.save(update_fields=['gateway_payload'])

        try:
            amount = Decimal(str(validation_data.get('amount')))
        except (InvalidOperation, TypeError):
            amount = None

        note = payment.gateway_payload.get('note', '') if payment.gateway_payload else ''
        if validation_data.get('status') in ['VALID', 'VALIDATED'] and amount == payment.amount:
            payment.status = 'paid'
            payment.paid_at = timezone.now()
            payment.save(update_fields=['status', 'paid_at'])
            _sync_testimonial_request(payment, note)
            return Response('Payment validated')

        payment.status = 'failed'
        payment.save(update_fields=['status'])
        _sync_testimonial_request(payment, note)
        return Response('Payment rejected')


class TestimonialReturnView(APIView):
    permission_classes = [AllowAny]

    def _handle(self, request):
        data = request.data if request.method == 'POST' else request.query_params
        tran_id = data.get('tran_id')
        status_value = data.get('status')
        val_id = data.get('val_id')

        payment = TestimonialPayment.objects.filter(transaction_id=tran_id).first() if tran_id else None
        result = 'failed'

        if payment and status_value in ['VALID', 'VALIDATED'] and val_id:
            try:
                validation_params = {
                    'val_id': val_id,
                    'store_id': settings.SSLCOMMERZ_STORE_ID,
                    'store_passwd': settings.SSLCOMMERZ_STORE_PASSWORD,
                    'format': 'json',
                }
                url = f"{_sslcommerz_validation_url()}?{urlencode(validation_params)}"
                with urlopen(url, timeout=30) as response:
                    validation_raw = response.read().decode('utf-8')
                validation_data = json.loads(validation_raw)

                payment.gateway_payload = payment.gateway_payload or {}
                payment.gateway_payload['validation'] = validation_data
                payment.save(update_fields=['gateway_payload'])

                amount = Decimal(str(validation_data.get('amount')))
                note = payment.gateway_payload.get('note', '') if payment.gateway_payload else ''
                if validation_data.get('status') in ['VALID', 'VALIDATED'] and amount == payment.amount:
                    payment.status = 'paid'
                    payment.paid_at = timezone.now()
                    payment.save(update_fields=['status', 'paid_at'])
                    _sync_testimonial_request(payment, note)
                    result = 'success'
            except Exception:
                result = 'failed'

        if payment and result != 'success' and payment.status == 'pending':
            note = payment.gateway_payload.get('note', '') if payment.gateway_payload else ''
            payment.status = 'failed'
            payment.save(update_fields=['status'])
            _sync_testimonial_request(payment, note)

        frontend_url = f"{settings.FRONTEND_BASE_URL.rstrip('/')}/student/testimonials"
        redirect_url = _append_query_param(
            frontend_url,
            {
                'payment': result,
                'source': 'testimonial',
                'tran_id': tran_id,
            },
        )
        return HttpResponseRedirect(redirect_url)

    def post(self, request, *args, **kwargs):
        return self._handle(request)

    def get(self, request, *args, **kwargs):
        return self._handle(request)
