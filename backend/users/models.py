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
    student_class = models.ForeignKey('classes.Class', on_delete=models.SET_NULL, null=True, related_name='students')
    date_of_birth = models.DateField(null=True, blank=True)
    address = models.TextField(blank=True, null=True)
    guardian_name = models.CharField(max_length=100, blank=True, null=True)
    guardian_phone = models.CharField(max_length=20, blank=True, null=True)
    
    class Meta:
        ordering = ['user__first_name']
    
    def __str__(self):
        return f"{self.user.get_full_name()} - Student"
