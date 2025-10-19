from django.db import models
from django.utils import timezone


class ClassMaterial(models.Model):
    """Class Materials/Resources model"""
    title = models.CharField(max_length=200)
    description = models.TextField()
    # Deprecated fields - kept for backward compatibility
    link = models.URLField(blank=True, null=True, help_text='External link to material (deprecated)')
    file = models.FileField(upload_to='materials/', blank=True, null=True, help_text='Upload file directly (deprecated)')
    teacher = models.ForeignKey('users.Teacher', on_delete=models.CASCADE, related_name='materials')
    class_assigned = models.ForeignKey('classes.Class', on_delete=models.CASCADE, related_name='materials')
    subject = models.ForeignKey('academics.Subject', on_delete=models.SET_NULL, null=True, blank=True, related_name='materials')
    uploaded_date = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-uploaded_date']
        verbose_name = 'Class Material'
        verbose_name_plural = 'Class Materials'

    def __str__(self):
        return f"{self.title} - {self.class_assigned}"


class MaterialAttachment(models.Model):
    """Multiple attachments (files/URLs) for a single class material"""
    ATTACHMENT_TYPE_CHOICES = (
        ('file', 'File'),
        ('url', 'URL'),
    )

    material = models.ForeignKey(ClassMaterial, on_delete=models.CASCADE, related_name='attachments')
    attachment_type = models.CharField(max_length=10, choices=ATTACHMENT_TYPE_CHOICES)
    file = models.FileField(upload_to='material_attachments/', blank=True, null=True)
    url = models.URLField(blank=True, null=True)
    title = models.CharField(max_length=200, help_text='Attachment title or filename')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']
        verbose_name = 'Material Attachment'
        verbose_name_plural = 'Material Attachments'

    def __str__(self):
        return f"{self.title} ({self.attachment_type})"
