from django.db import models
from django.utils import timezone


class Result(models.Model):
    """Exam Results model"""
    title = models.CharField(max_length=200)
    file = models.FileField(upload_to='results/')
    published_date = models.DateTimeField(default=timezone.now)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-published_date']
    
    def __str__(self):
        return self.title
