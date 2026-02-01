from django.db import models


class Class(models.Model):
    """Class/Section model"""
    name = models.CharField(max_length=50, verbose_name='Class Name')
    section = models.CharField(max_length=10, blank=True, null=True)
    session = models.CharField(max_length=20, blank=True, null=True)
    
    class Meta:
        verbose_name = 'Class'
        verbose_name_plural = 'Classes'
        ordering = ['name', 'section']
        unique_together = ['name', 'section', 'session']
    
    def __str__(self):
        if self.section and self.session:
            return f"{self.name} - {self.section} ({self.session})"
        if self.section:
            return f"{self.name} - {self.section}"
        if self.session:
            return f"{self.name} ({self.session})"
        return self.name
