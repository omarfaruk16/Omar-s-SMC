import json
import uuid
from decimal import Decimal, InvalidOperation
from urllib.parse import urlencode
from urllib.request import urlopen, Request

from django.conf import settings
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from .models import Fee, Payment
from .serializers import (
    FeeSerializer, PaymentSerializer, 
    PaymentCreateSerializer, FeeStudentSerializer
)
from users.models import Student
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model

User = get_user_model()


def _sslcommerz_base_url():
    return 'https://sandbox.sslcommerz.com' if settings.SSLCOMMERZ_SANDBOX else 'https://securepay.sslcommerz.com'


def _sslcommerz_init_url():
    return f"{_sslcommerz_base_url()}/gwprocess/v4/api.php"


def _sslcommerz_validation_url():
    return f"{_sslcommerz_base_url()}/validator/api/validationserverAPI.php"


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


class FeeViewSet(viewsets.ModelViewSet):
    """ViewSet for Fee management"""
    queryset = Fee.objects.all()
    serializer_class = FeeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # Admin sees all fees
        if user.role == 'admin':
            return Fee.objects.all()
        
        # Students see fees for their class
        elif user.role == 'student':
            try:
                student = user.student_profile
                if student.student_class:
                    return Fee.objects.filter(class_assigned=student.student_class)
            except:
                pass
        
        return Fee.objects.none()
    
    def create(self, request, *args, **kwargs):
        # Only admin can create fees
        if request.user.role != 'admin':
            return Response(
                {'error': 'Admin access required'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        # Only admin can update fees
        if request.user.role != 'admin':
            return Response(
                {'error': 'Admin access required'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        # Only admin can delete fees
        if request.user.role != 'admin':
            return Response(
                {'error': 'Admin access required'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)
    
    @action(detail=True, methods=['get'])
    def students(self, request, pk=None):
        """Get all students for a fee with their payment status (admin only)"""
        if request.user.role != 'admin':
            return Response(
                {'error': 'Admin access required'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        fee = self.get_object()
        students = Student.objects.filter(student_class=fee.class_assigned)
        
        student_payments = []
        for student in students:
            payment = Payment.objects.filter(student=student, fee=fee).first()
            
            student_payments.append({
                'student_id': student.id,
                'student_name': student.user.get_full_name(),
                'student_phone': student.user.phone,
                'payment_status': payment.status if payment else 'not_paid',
                'payment_id': payment.id if payment else None,
                'payment_method': payment.method if payment else None,
                'transaction_id': payment.transaction_id if payment else None,
                'payment_date': payment.payment_date if payment else None,
            })
        
        return Response(student_payments)
    
    @action(detail=False, methods=['get'])
    def my_fees(self, request):
        """Get fees for current student with payment status"""
        if request.user.role != 'student':
            return Response(
                {'error': 'Student access required'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            student = request.user.student_profile
            if not student.student_class:
                return Response([])
            
            fees = Fee.objects.filter(class_assigned=student.student_class)
            
            fee_data = []
            for fee in fees:
                payment = Payment.objects.filter(student=student, fee=fee).first()
                
                fee_data.append({
                    'fee_id': fee.id,
                    'title': fee.title,
                    'month': fee.month,
                    'amount': str(fee.amount),
                    'fee_status': fee.status,
                    'payment_status': payment.status if payment else 'not_paid',
                    'payment_id': payment.id if payment else None,
                    'payment_method': payment.method if payment else None,
                    'payment_date': payment.payment_date if payment else None,
                })
            
            serializer = FeeStudentSerializer(fee_data, many=True)
            return Response(serializer.data)
        
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class PaymentViewSet(viewsets.ModelViewSet):
    """ViewSet for Payment management"""
    queryset = Payment.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return PaymentCreateSerializer
        return PaymentSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        # Admin sees all payments
        if user.role == 'admin':
            return Payment.objects.all()
        
        # Students see their own payments
        elif user.role == 'student':
            try:
                student = user.student_profile
                return Payment.objects.filter(student=student)
            except:
                pass
        
        return Payment.objects.none()
    
    def create(self, request, *args, **kwargs):
        # Only students can create payments
        if request.user.role != 'student':
            return Response(
                {'error': 'Only students can make payments'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            student = request.user.student_profile
        except:
            return Response(
                {'error': 'Student profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if fee exists and is running
        fee_id = request.data.get('fee')
        try:
            fee = Fee.objects.get(id=fee_id)
            if fee.status != 'running':
                return Response(
                    {'error': 'This fee is not available for payment'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Fee.DoesNotExist:
            return Response(
                {'error': 'Fee not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if already paid or pending
        existing_payment = Payment.objects.filter(
            student=student, 
            fee=fee
        ).exclude(status='rejected').first()
        
        if existing_payment:
            return Response(
                {'error': f'You already have a {existing_payment.status} payment for this fee'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(student=student)
        
        return Response(
            {
                'message': 'Payment submitted successfully. Waiting for admin approval.',
                'payment': serializer.data
            },
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a payment (admin only)"""
        if request.user.role != 'admin':
            return Response(
                {'error': 'Admin access required'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        payment = self.get_object()
        payment.status = 'approved'
        payment.approved_date = timezone.now()
        payment.save()
        
        return Response({'message': 'Payment approved successfully'})
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a payment (admin only)"""
        if request.user.role != 'admin':
            return Response(
                {'error': 'Admin access required'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        payment = self.get_object()
        payment.status = 'rejected'
        notes = request.data.get('notes', '')
        if notes:
            payment.notes = notes
        payment.save()
        
        return Response({'message': 'Payment rejected'})
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get all pending payments (admin only)"""
        if request.user.role != 'admin':
            return Response(
                {'error': 'Admin access required'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        pending_payments = Payment.objects.filter(status='pending')
        serializer = self.get_serializer(pending_payments, many=True)
        return Response(serializer.data)


class SSLCommerzInitView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        user = request.user if request.user.is_authenticated else None
        if not user:
            token = request.data.get('token')
            user = _get_user_from_token(token)
        if not user or user.role != 'student':
            return Response({'error': 'Student access required'}, status=status.HTTP_403_FORBIDDEN)

        try:
            student = user.student_profile
        except Exception:
            return Response({'error': 'Student profile not found'}, status=status.HTTP_404_NOT_FOUND)

        payload = request.data
        if 'postdata' in payload and isinstance(payload['postdata'], str):
            try:
                payload = json.loads(payload['postdata'])
            except json.JSONDecodeError:
                payload = request.data

        fee_id = payload.get('fee_id') or payload.get('fee')
        if not fee_id:
            return Response({'error': 'fee_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            fee = Fee.objects.get(id=fee_id)
            if fee.status != 'running':
                return Response({'error': 'This fee is not available for payment'}, status=status.HTTP_400_BAD_REQUEST)
        except Fee.DoesNotExist:
            return Response({'error': 'Fee not found'}, status=status.HTTP_404_NOT_FOUND)

        existing_payment = Payment.objects.filter(student=student, fee=fee).exclude(status='rejected').first()
        if existing_payment:
            return Response({'error': f'You already have a {existing_payment.status} payment for this fee'}, status=status.HTTP_400_BAD_REQUEST)

        if not settings.SSLCOMMERZ_STORE_ID or not settings.SSLCOMMERZ_STORE_PASSWORD:
            return Response({'error': 'Payment gateway not configured'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        tran_id = f"FEE{fee.id}-{uuid.uuid4().hex[:10].upper()}"
        payment = Payment.objects.create(
            student=student,
            fee=fee,
            method='sslcommerz',
            transaction_id=tran_id,
            status='pending',
            payment_date=timezone.now(),
        )

        customer_name = user.get_full_name() or user.email
        post_data = {
            'store_id': settings.SSLCOMMERZ_STORE_ID,
            'store_passwd': settings.SSLCOMMERZ_STORE_PASSWORD,
            'total_amount': str(fee.amount),
            'currency': settings.SSLCOMMERZ_CURRENCY,
            'tran_id': tran_id,
            'success_url': settings.SSLCOMMERZ_SUCCESS_URL,
            'fail_url': settings.SSLCOMMERZ_FAIL_URL,
            'cancel_url': settings.SSLCOMMERZ_CANCEL_URL,
            'ipn_url': settings.SSLCOMMERZ_IPN_URL,
            'product_category': 'education',
            'product_name': fee.title,
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
            payment.save(update_fields=['gateway_payload'])
            return Response({'status': 'fail', 'message': 'Failed to connect with SSLCOMMERZ'}, status=status.HTTP_502_BAD_GATEWAY)

        payment.gateway_payload = {'init_response': ssl_response}
        payment.save(update_fields=['gateway_payload'])

        gateway_url = ssl_response.get('GatewayPageURL')
        if gateway_url:
            return Response({'status': 'success', 'data': gateway_url, 'logo': ssl_response.get('storeLogo')})

        return Response({'status': 'fail', 'message': ssl_response.get('failedreason') or 'Gateway error'}, status=status.HTTP_400_BAD_REQUEST)


class SSLCommerzIPNView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data
        tran_id = data.get('tran_id')
        status_value = data.get('status')
        val_id = data.get('val_id')

        if not tran_id:
            return Response('Missing transaction ID', status=status.HTTP_400_BAD_REQUEST)

        payment = Payment.objects.filter(transaction_id=tran_id, method='sslcommerz').first()
        if not payment:
            return Response('Payment not found', status=status.HTTP_404_NOT_FOUND)

        payment.gateway_payload = payment.gateway_payload or {}
        payment.gateway_payload['ipn'] = data
        payment.save(update_fields=['gateway_payload'])

        if status_value not in ['VALID', 'VALIDATED']:
            payment.status = 'rejected'
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

        if validation_data.get('status') in ['VALID', 'VALIDATED'] and amount == payment.fee.amount:
            payment.status = 'approved'
            payment.approved_date = timezone.now()
            payment.save(update_fields=['status', 'approved_date'])
            return Response('Payment validated')

        payment.status = 'rejected'
        payment.save(update_fields=['status'])
        return Response('Payment rejected')
