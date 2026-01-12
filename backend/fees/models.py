from django.db import models
from django.utils import timezone


class Fee(models.Model):
    """Fee Management model"""
    
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('running', 'Running'),
        ('complete', 'Complete'),
    )

    TYPE_CHOICES = (
        ('regular', 'Regular'),
        ('exam', 'Exam'),
    )
    
    MONTH_CHOICES = (
        ('january', 'January'),
        ('february', 'February'),
        ('march', 'March'),
        ('april', 'April'),
        ('may', 'May'),
        ('june', 'June'),
        ('july', 'July'),
        ('august', 'August'),
        ('september', 'September'),
        ('october', 'October'),
        ('november', 'November'),
        ('december', 'December'),
    )
    
    title = models.CharField(max_length=200)
    class_assigned = models.ForeignKey('classes.Class', on_delete=models.CASCADE, related_name='fees')
    exam = models.ForeignKey('academics.Exam', on_delete=models.SET_NULL, null=True, blank=True, related_name='fees')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    month = models.CharField(max_length=20, choices=MONTH_CHOICES)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    fee_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='regular')
    created_date = models.DateTimeField(default=timezone.now)
    
    class Meta:
        ordering = ['-created_date']
        unique_together = ['class_assigned', 'month', 'title']
    
    def __str__(self):
        return f"{self.title} - {self.class_assigned} - {self.month}"


class Payment(models.Model):
    """Payment model for fee transactions"""
    
    METHOD_CHOICES = (
        ('bkash', 'bKash'),
        ('nagad', 'Nagad'),
        ('rocket', 'Rocket'),
        ('cash', 'Cash'),
        ('sslcommerz', 'SSLCommerz'),
    )
    
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )
    
    student = models.ForeignKey('users.Student', on_delete=models.CASCADE, related_name='payments')
    fee = models.ForeignKey(Fee, on_delete=models.CASCADE, related_name='payments')
    method = models.CharField(max_length=10, choices=METHOD_CHOICES)
    number = models.CharField(max_length=20, blank=True, null=True, help_text='Mobile number for digital payments')
    transaction_id = models.CharField(max_length=50, blank=True, null=True, verbose_name='Transaction ID')
    gateway_payload = models.JSONField(blank=True, null=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    payment_date = models.DateTimeField(default=timezone.now)
    approved_date = models.DateTimeField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    
    class Meta:
        ordering = ['-payment_date']
    
    def __str__(self):
        return f"{self.student.user.get_full_name()} - {self.fee.title} - {self.status}"


class FeePaymentIntent(models.Model):
    """Tracks SSLCommerz payment initiation before approval."""

    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
    )

    student = models.ForeignKey('users.Student', on_delete=models.CASCADE, related_name='fee_payment_intents')
    fee = models.ForeignKey(Fee, on_delete=models.CASCADE, related_name='payment_intents')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    transaction_id = models.CharField(max_length=64, unique=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    gateway_payload = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    paid_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.student.user.get_full_name()} - {self.fee.title} - {self.status}"
