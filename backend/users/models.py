from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    """Custom User model with role-based authentication"""
    
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('teacher', 'Teacher'),
        ('student', 'Student'),
    )
    
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )
    
    email = models.EmailField(_('email address'), unique=True)
    phone = models.CharField(max_length=15, blank=True, null=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    image = models.ImageField(upload_to='users/', blank=True, null=True)
    
    # Use email as the username field
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'role']
    
    class Meta:
        ordering = ['-date_joined']
    
    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.role})"


class Teacher(models.Model):
    """Teacher profile model"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='teacher_profile')
    nid = models.CharField(max_length=20, unique=True, verbose_name='National ID')
    teacher_id = models.CharField(max_length=30, unique=True, verbose_name='Teacher ID', null=True, blank=True)
    designation = models.CharField(max_length=100, blank=True)
    preferred_class = models.ForeignKey(
        'classes.Class',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='preferred_teachers'
    )
    preferred_subject = models.ForeignKey(
        'academics.Subject',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='preferred_teachers'
    )
    assigned_classes = models.ManyToManyField('classes.Class', related_name='teachers', blank=True)
    # index_num = models.CharField(max_length=20, unique=True, verbose_name='Index Number', blank=True, null=True)
    # designation = models.CharField(max_length=100, blank=True, null=True, default='Teacher')
    # date_of_birth = models.DateField(null=True, blank=True, default=None)
    
    class Meta:
        ordering = ['user__first_name']
    
    def __str__(self):
        identifier = self.teacher_id or 'Teacher'
        return f"{self.user.get_full_name()} - {identifier}"


class Student(models.Model):
    """Student profile model"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    student_class = models.ForeignKey('classes.Class', on_delete=models.SET_NULL, null=True, blank=True, related_name='students')
    roll_number = models.CharField(max_length=30, blank=True, null=True)
    
    # Academic Information
    registration = models.CharField(max_length=50, blank=True, null=True, verbose_name='Registration Number')
    session = models.CharField(max_length=20, blank=True, null=True, verbose_name='Academic Session')
    
    # Personal Information
    bangla_name = models.CharField(max_length=200, blank=True, null=True, verbose_name='Name in Bangla')
    date_of_birth = models.DateField(null=True, blank=True)
    birth_registration_number = models.CharField(max_length=50, blank=True, null=True)
    gender = models.CharField(max_length=10, choices=[('male', 'Male'), ('female', 'Female'), ('other', 'Other')], blank=True, null=True)
    religion = models.CharField(max_length=50, blank=True, null=True)
    blood_group = models.CharField(max_length=5, blank=True, null=True)
    nationality = models.CharField(max_length=50, default='Bangladeshi')
    
    # Address Information
    address = models.TextField(blank=True, null=True)
    permanent_address = models.TextField(blank=True, null=True)
    village = models.CharField(max_length=100, blank=True, null=True, verbose_name='Village')
    post_office = models.CharField(max_length=100, blank=True, null=True, verbose_name='Post Office')
    post_code = models.CharField(max_length=10, blank=True, null=True)
    upazilla_thana = models.CharField(max_length=100, blank=True, null=True)
    district = models.CharField(max_length=100, blank=True, null=True)
    
    # Family Information
    fathers_name = models.CharField(max_length=100, blank=True, null=True)
    fathers_nid = models.CharField(max_length=20, blank=True, null=True)
    fathers_occupation = models.CharField(max_length=100, blank=True, null=True)
    mothers_name = models.CharField(max_length=100, blank=True, null=True)
    mothers_nid = models.CharField(max_length=20, blank=True, null=True)
    mothers_occupation = models.CharField(max_length=100, blank=True, null=True)
    guardian_name = models.CharField(max_length=100, blank=True, null=True)
    guardian_phone = models.CharField(max_length=20, blank=True, null=True)
    guardian_monthly_income = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    
    # Academic History (SSC/Equivalent)
    ssc_board = models.CharField(max_length=100, blank=True, null=True)
    ssc_registration_no = models.CharField(max_length=50, blank=True, null=True)
    ssc_group = models.CharField(max_length=50, blank=True, null=True)
    ssc_roll_number = models.CharField(max_length=50, blank=True, null=True)
    ssc_year_of_passing = models.IntegerField(blank=True, null=True)
    ssc_gpa = models.DecimalField(max_digits=4, decimal_places=2, blank=True, null=True)
    
    # Subject Selections
    first_subject = models.ForeignKey('academics.Subject', on_delete=models.SET_NULL, null=True, blank=True, related_name='students_first')
    second_subject = models.ForeignKey('academics.Subject', on_delete=models.SET_NULL, null=True, blank=True, related_name='students_second')
    third_subject = models.ForeignKey('academics.Subject', on_delete=models.SET_NULL, null=True, blank=True, related_name='students_third')
    fourth_subject = models.ForeignKey('academics.Subject', on_delete=models.SET_NULL, null=True, blank=True, related_name='students_fourth')
    
    class Meta:
        ordering = ['user__first_name']
    
    def __str__(self):
        return f"{self.user.get_full_name()} - Student"


class PasswordResetOTP(models.Model):
    """One-time password for email-based password reset."""

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_reset_otps')
    code_hash = models.CharField(max_length=64)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    verified_at = models.DateTimeField(blank=True, null=True)
    reset_token = models.UUIDField(blank=True, null=True, unique=True)
    is_used = models.BooleanField(default=False)
    attempts = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_used', 'created_at']),
        ]

    def __str__(self):
        return f"PasswordResetOTP(user={self.user_id}, used={self.is_used})"
