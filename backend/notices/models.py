from django.db import models
from django.utils import timezone


class Notice(models.Model):
    """Notice/Announcement model"""
    title = models.CharField(max_length=200)
    description = models.TextField()
    file = models.FileField(upload_to='notices/', blank=True, null=True)
    created_date = models.DateTimeField(default=timezone.now)
    is_active = models.BooleanField(default=True)
    
    TARGET_ROLE_CHOICES = (
        ('all', 'All'),
        ('admin', 'Admin'),
        ('teacher', 'Teacher'),
        ('student', 'Student'),
    )
    target_role = models.CharField(max_length=10, choices=TARGET_ROLE_CHOICES, default='all')
    target_classes = models.ManyToManyField('classes.Class', related_name='target_notices', blank=True)
    
    class Meta:
        ordering = ['-created_date']
    
    def __str__(self):
        return self.title
