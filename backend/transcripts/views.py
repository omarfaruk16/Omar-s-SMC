import json
import uuid
from decimal import Decimal, InvalidOperation
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse
from urllib.request import Request, urlopen

from django.conf import settings
from django.http import HttpResponseRedirect
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import AccessToken

from .models import TranscriptPayment, TranscriptRequest
from .serializers import TranscriptRequestSerializer

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
    base_url = request.build_absolute_uri("/api/transcripts/sslcommerz/return/")
    return _append_query_param(base_url, {"result": result, "source": "transcript"})


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


class TranscriptRequestViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TranscriptRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return TranscriptRequest.objects.all()
        if user.role == 'student':
            try:
                student = user.student_profile
            except Exception:
                return TranscriptRequest.objects.none()
            return TranscriptRequest.objects.filter(student=student)
        return TranscriptRequest.objects.none()

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)

        transcript = self.get_object()
        transcript.status = 'approved'
        transcript.reviewed_at = timezone.now()
        transcript.notes = request.data.get('notes', '')
        transcript.save(update_fields=['status', 'reviewed_at', 'notes'])
        return Response({'message': 'Transcript request approved'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)

        transcript = self.get_object()
        transcript.status = 'rejected'
        transcript.reviewed_at = timezone.now()
        transcript.notes = request.data.get('notes', '')
        transcript.save(update_fields=['status', 'reviewed_at', 'notes'])
        return Response({'message': 'Transcript request rejected'})


class TranscriptInitView(APIView):
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
            amount = Decimal(str(settings.TRANSCRIPT_FEE_AMOUNT))
        except (InvalidOperation, TypeError):
            return Response({'error': 'Transcript fee amount is invalid'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        tran_id = f"TRX-{uuid.uuid4().hex[:12].upper()}"
        payment = TranscriptPayment.objects.create(
            student=student,
            amount=amount,
            transaction_id=tran_id,
            status='pending',
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
            'ipn_url': settings.SSLCOMMERZ_TRANSCRIPT_IPN_URL,
            'product_category': 'education',
            'product_name': 'Transcript Request',
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
            payment.gateway_payload = {'error': str(exc)}
            payment.status = 'failed'
            payment.save(update_fields=['gateway_payload', 'status'])
            return Response({'status': 'fail', 'message': 'Failed to connect with SSLCOMMERZ'}, status=status.HTTP_502_BAD_GATEWAY)

        payment.gateway_payload = {'init_response': ssl_response}
        payment.save(update_fields=['gateway_payload'])

        gateway_url = ssl_response.get('GatewayPageURL')
        if gateway_url:
            return Response({'status': 'success', 'data': gateway_url, 'logo': ssl_response.get('storeLogo')})

        payment.status = 'failed'
        payment.save(update_fields=['status'])
        return Response({'status': 'fail', 'message': ssl_response.get('failedreason') or 'Gateway error'}, status=status.HTTP_400_BAD_REQUEST)


class TranscriptIPNView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data
        tran_id = data.get('tran_id')
        status_value = data.get('status')
        val_id = data.get('val_id')

        if not tran_id:
            return Response('Missing transaction ID', status=status.HTTP_400_BAD_REQUEST)

        payment = TranscriptPayment.objects.filter(transaction_id=tran_id).first()
        if not payment:
            return Response('Payment not found', status=status.HTTP_404_NOT_FOUND)

        payment.gateway_payload = payment.gateway_payload or {}
        payment.gateway_payload['ipn'] = data
        payment.save(update_fields=['gateway_payload'])

        if status_value not in ['VALID', 'VALIDATED']:
            payment.status = 'failed'
            payment.save(update_fields=['status'])
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

        if validation_data.get('status') in ['VALID', 'VALIDATED'] and amount == payment.amount:
            payment.status = 'paid'
            payment.paid_at = timezone.now()
            payment.save(update_fields=['status', 'paid_at'])

            TranscriptRequest.objects.get_or_create(
                payment=payment,
                defaults={
                    'student': payment.student,
                    'status': 'pending_review',
                    'requested_at': timezone.now(),
                },
            )

            return Response('Payment validated')

        payment.status = 'failed'
        payment.save(update_fields=['status'])
        return Response('Payment rejected')


class TranscriptReturnView(APIView):
    permission_classes = [AllowAny]

    def _handle(self, request):
        data = request.data if request.method == 'POST' else request.query_params
        tran_id = data.get('tran_id')
        status_value = data.get('status')
        val_id = data.get('val_id')

        payment = TranscriptPayment.objects.filter(transaction_id=tran_id).first() if tran_id else None
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
                if validation_data.get('status') in ['VALID', 'VALIDATED'] and amount == payment.amount:
                    payment.status = 'paid'
                    payment.paid_at = timezone.now()
                    payment.save(update_fields=['status', 'paid_at'])

                    TranscriptRequest.objects.get_or_create(
                        payment=payment,
                        defaults={
                            'student': payment.student,
                            'status': 'pending_review',
                            'requested_at': timezone.now(),
                        },
                    )
                    result = 'success'
            except Exception:
                result = 'failed'

        if payment and result != 'success' and payment.status == 'pending':
            payment.status = 'failed'
            payment.save(update_fields=['status'])

        frontend_url = f"{settings.FRONTEND_BASE_URL.rstrip('/')}/student/dashboard"
        redirect_url = _append_query_param(
            frontend_url,
            {
                'payment': result,
                'source': 'transcript',
                'tran_id': tran_id,
            },
        )
        return HttpResponseRedirect(redirect_url)

    def post(self, request, *args, **kwargs):
        return self._handle(request)

    def get(self, request, *args, **kwargs):
        return self._handle(request)
