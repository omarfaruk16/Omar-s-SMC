from rest_framework import serializers
from .models import TranscriptRequest, TranscriptPayment


class TranscriptPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = TranscriptPayment
        fields = ['id', 'amount', 'transaction_id', 'status', 'created_at', 'paid_at']


class TranscriptRequestSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    student_email = serializers.SerializerMethodField()
    payment_amount = serializers.SerializerMethodField()
    payment_status = serializers.SerializerMethodField()
    transaction_id = serializers.SerializerMethodField()

    class Meta:
        model = TranscriptRequest
        fields = [
            'id',
            'student',
            'student_name',
            'student_email',
            'status',
            'requested_at',
            'reviewed_at',
            'notes',
            'payment_amount',
            'payment_status',
            'transaction_id',
        ]
        read_only_fields = fields

    def get_student_name(self, obj):
        return obj.student.user.get_full_name()

    def get_student_email(self, obj):
        return obj.student.user.email

    def get_payment_amount(self, obj):
        return str(obj.payment.amount)

    def get_payment_status(self, obj):
        return obj.payment.status

    def get_transaction_id(self, obj):
        return obj.payment.transaction_id
