from rest_framework import serializers
from .models import TestimonialRequest, TestimonialPayment, TestimonialDetails


class TestimonialPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestimonialPayment
        fields = ['id', 'amount', 'transaction_id', 'status', 'created_at', 'paid_at']


class TestimonialDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestimonialDetails
        fields = [
            'id', 'bangla_name', 'name', 'roll_number', 'registration', 'session',
            'father_bn', 'mother_bn', 'village', 'post_office', 'upazila', 'district',
            'gpa', 'date_of_birth', 'year', 'serial_number', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'serial_number', 'created_at', 'updated_at']


class TestimonialRequestSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    student_email = serializers.SerializerMethodField()
    student_roll = serializers.SerializerMethodField()
    student_class = serializers.SerializerMethodField()
    payment_amount = serializers.SerializerMethodField()
    payment_status = serializers.SerializerMethodField()
    transaction_id = serializers.SerializerMethodField()
    details = TestimonialDetailsSerializer(read_only=True)

    class Meta:
        model = TestimonialRequest
        fields = [
            'id',
            'student',
            'student_name',
            'student_email',
            'student_roll',
            'student_class',
            'status',
            'note',
            'rejection_reason',
            'requested_at',
            'processed_at',
            'payment_amount',
            'payment_status',
            'transaction_id',
            'details',
        ]
        read_only_fields = ['id', 'student', 'requested_at', 'processed_at', 'payment_amount', 'payment_status', 'transaction_id', 'details']

    def get_student_name(self, obj):
        return obj.student.user.get_full_name()

    def get_student_email(self, obj):
        return obj.student.user.email
    
    def get_student_roll(self, obj):
        return obj.student.roll_number
    
    def get_student_class(self, obj):
        if obj.student.student_class:
            return obj.student.student_class.name
        return None

    def get_payment_amount(self, obj):
        return str(obj.payment.amount)

    def get_payment_status(self, obj):
        return obj.payment.status

    def get_transaction_id(self, obj):
        return obj.payment.transaction_id
