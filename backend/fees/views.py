from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from .models import Fee, Payment
from .serializers import (
    FeeSerializer, PaymentSerializer, 
    PaymentCreateSerializer, FeeStudentSerializer
)
from users.models import Student


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
