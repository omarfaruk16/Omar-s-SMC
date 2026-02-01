from django.db import models
from django.utils import timezone


class TestimonialPayment(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
    )

    student = models.ForeignKey('users.Student', on_delete=models.CASCADE, related_name='testimonial_payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    transaction_id = models.CharField(max_length=64, unique=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    gateway_payload = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    paid_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.student.user.get_full_name()} - {self.amount} - {self.status}"


class TestimonialRequest(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('paid', 'Paid'),
    )

    student = models.ForeignKey('users.Student', on_delete=models.CASCADE, related_name='testimonial_requests')
    payment = models.OneToOneField(TestimonialPayment, on_delete=models.PROTECT, related_name='testimonial_request')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    note = models.TextField(blank=True, null=True, help_text='Student note for testimonial request')
    rejection_reason = models.TextField(blank=True, null=True, help_text='Reason for rejection by admin')
    requested_at = models.DateTimeField(default=timezone.now)
    processed_at = models.DateTimeField(blank=True, null=True, help_text='When admin approved/rejected')

    class Meta:
        ordering = ['-requested_at']

    def __str__(self):
        return f"{self.student.user.get_full_name()} - {self.status}"


class TestimonialDetails(models.Model):
    """Stores admin-edited testimonial details for PDF generation"""
    testimonial_request = models.OneToOneField(
        TestimonialRequest, 
        on_delete=models.CASCADE, 
        related_name='details',
        help_text='Related testimonial request'
    )
    
    # Personal Information (can be edited by admin during approval)
    bangla_name = models.CharField(max_length=200, blank=True, null=True)
    name = models.CharField(max_length=200, blank=True, null=True)
    roll_number = models.CharField(max_length=50, blank=True, null=True)
    registration = models.CharField(max_length=50, blank=True, null=True)
    session = models.CharField(max_length=20, blank=True, null=True)
    
    # Family Information
    father_bn = models.CharField(max_length=200, blank=True, null=True, verbose_name='Father Name (Bangla)')
    mother_bn = models.CharField(max_length=200, blank=True, null=True, verbose_name='Mother Name (Bangla)')
    
    # Address Information
    village = models.CharField(max_length=100, blank=True, null=True)
    post_office = models.CharField(max_length=100, blank=True, null=True)
    upazila = models.CharField(max_length=100, blank=True, null=True)
    district = models.CharField(max_length=100, blank=True, null=True)
    
    # Academic Information
    gpa = models.DecimalField(max_digits=3, decimal_places=2, default=5.00)
    date_of_birth = models.DateField(blank=True, null=True)
    year = models.IntegerField(blank=True, null=True, help_text='Year for testimonial')
    
    # Serial number for testimonial
    serial_number = models.CharField(max_length=20, unique=True, help_text='Unique serial number (min 5 digits)')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Testimonial Detail'
        verbose_name_plural = 'Testimonial Details'
    
    def __str__(self):
        return f"Details for {self.testimonial_request.student.user.get_full_name()} - {self.serial_number}"

