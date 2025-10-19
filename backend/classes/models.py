from django.db import models


class Class(models.Model):
    """Class/Section model"""
    name = models.CharField(max_length=50, verbose_name='Class Name')
    section = models.CharField(max_length=10, blank=True, null=True)
    
    class Meta:
        verbose_name = 'Class'
        verbose_name_plural = 'Classes'
        ordering = ['name', 'section']
        unique_together = ['name', 'section']
    
    def __str__(self):
        if self.section:
            return f"{self.name} - {self.section}"
        return self.name
