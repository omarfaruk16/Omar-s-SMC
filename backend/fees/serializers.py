from rest_framework import serializers
from .models import Fee, Payment


class FeeSerializer(serializers.ModelSerializer):
    """Serializer for Fee model"""
    class_name = serializers.SerializerMethodField()
    payment_count = serializers.SerializerMethodField()
    exam_title = serializers.SerializerMethodField()
    
    class Meta:
        model = Fee
        fields = ['id', 'title', 'class_assigned', 'class_name', 'amount', 
                  'month', 'status', 'fee_type', 'exam', 'exam_title', 'created_date', 'payment_count']
        read_only_fields = ['id', 'created_date', 'class_name', 'payment_count']
    
    def get_class_name(self, obj):
        return str(obj.class_assigned)
    
    def get_payment_count(self, obj):
        return obj.payments.filter(status='approved').count()

    def get_exam_title(self, obj):
        if obj.exam:
            return obj.exam.title
        if obj.fee_type == 'exam' and obj.title:
            return obj.title.replace(' Exam Fee', '')
        return None


class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for Payment model"""
    student_name = serializers.SerializerMethodField()
    student_phone = serializers.SerializerMethodField()
    fee_title = serializers.SerializerMethodField()
    fee_amount = serializers.SerializerMethodField()
    
    class Meta:
        model = Payment
        fields = ['id', 'student', 'student_name', 'student_phone', 'fee', 
                  'fee_title', 'fee_amount', 'method', 'number', 'transaction_id', 
                  'status', 'payment_date', 'approved_date', 'notes']
        read_only_fields = ['id', 'payment_date', 'approved_date', 'student_name', 
                          'student_phone', 'fee_title', 'fee_amount']
    
    def get_student_name(self, obj):
        return obj.student.user.get_full_name()
    
    def get_student_phone(self, obj):
        return obj.student.user.phone
    
    def get_fee_title(self, obj):
        return obj.fee.title
    
    def get_fee_amount(self, obj):
        return str(obj.fee.amount)


class PaymentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating Payment"""
    
    class Meta:
        model = Payment
        fields = ['id', 'fee', 'method', 'number', 'transaction_id', 'payment_date']
        read_only_fields = ['id', 'payment_date']
    
    def validate(self, data):
        # Validate that digital payment methods have required fields
        if data['method'] in ['bkash', 'nagad', 'rocket']:
            if not data.get('number'):
                raise serializers.ValidationError({
                    'number': 'Mobile number is required for digital payments.'
                })
            if not data.get('transaction_id'):
                raise serializers.ValidationError({
                    'transaction_id': 'Transaction ID is required for digital payments.'
                })
        return data
    
    def create(self, validated_data):
        # Student is set from request.user in the view
        return super().create(validated_data)


class FeeStudentSerializer(serializers.Serializer):
    """Serializer for fee with student payment status"""
    fee_id = serializers.IntegerField()
    title = serializers.CharField()
    month = serializers.CharField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    fee_status = serializers.CharField()
    fee_type = serializers.CharField()
    class_id = serializers.IntegerField()
    exam_title = serializers.CharField(allow_null=True)
    payment_status = serializers.CharField()
    payment_id = serializers.IntegerField(allow_null=True)
    payment_method = serializers.CharField(allow_null=True)
    payment_date = serializers.DateTimeField(allow_null=True)
