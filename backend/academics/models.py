from django.db import models


class TeacherSubjectAssignment(models.Model):
    """Model to track which subjects a teacher teaches in which classes"""
    teacher = models.ForeignKey('users.Teacher', on_delete=models.CASCADE, related_name='subject_assignments')
    subject = models.ForeignKey('Subject', on_delete=models.CASCADE, related_name='teacher_assignments')
    class_assigned = models.ForeignKey('classes.Class', on_delete=models.CASCADE, related_name='teacher_subject_assignments')

    class Meta:
        unique_together = ('teacher', 'subject', 'class_assigned')
        ordering = ['teacher', 'class_assigned', 'subject']

    def __str__(self):
        return f"{self.teacher.user.get_full_name()} - {self.subject.name} - {self.class_assigned}"


class Subject(models.Model):
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=20, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    classes = models.ManyToManyField('classes.Class', related_name='subjects', blank=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class AttendanceRecord(models.Model):
    STATUS_CHOICES = (
        ('present', 'Present'),
        ('absent', 'Absent'),
    )
    date = models.DateField()
    student = models.ForeignKey('users.Student', on_delete=models.CASCADE, related_name='attendance_records')
    class_assigned = models.ForeignKey('classes.Class', on_delete=models.CASCADE, related_name='attendance_records')
    subject = models.ForeignKey('academics.Subject', on_delete=models.SET_NULL, null=True, blank=True, related_name='attendance_records')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    marked_by = models.ForeignKey('users.Teacher', on_delete=models.SET_NULL, null=True, blank=True, related_name='attendance_marked')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('date', 'student')
        ordering = ['-date', 'student__user__first_name']

    def __str__(self):
        return f"{self.date} - {self.student} - {self.status}"


class TimetableSlot(models.Model):
    WEEKDAY_CHOICES = [(i, day) for i, day in enumerate(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])]
    class_assigned = models.ForeignKey('classes.Class', on_delete=models.CASCADE, related_name='timetable_slots')
    weekday = models.IntegerField(choices=WEEKDAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    subject = models.ForeignKey(Subject, on_delete=models.SET_NULL, null=True, blank=True, related_name='timetable_slots')
    teacher = models.ForeignKey('users.Teacher', on_delete=models.SET_NULL, null=True, blank=True, related_name='timetable_slots')

    class Meta:
        ordering = ['class_assigned', 'weekday', 'start_time']
        unique_together = ('class_assigned', 'weekday', 'start_time')

    def __str__(self):
        return f"{self.class_assigned} - {self.get_weekday_display()} {self.start_time}-{self.end_time}"


class Mark(models.Model):
    """Per-subject marks for a student (basic)."""
    student = models.ForeignKey('users.Student', on_delete=models.CASCADE, related_name='marks')
    class_assigned = models.ForeignKey('classes.Class', on_delete=models.CASCADE, related_name='marks')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='marks')
    submission = models.ForeignKey('ResultSubmission', on_delete=models.SET_NULL, null=True, blank=True, related_name='marks')
    exam_name = models.CharField(max_length=100)
    score = models.FloatField()
    max_score = models.FloatField(default=100)
    date = models.DateField()
    published = models.BooleanField(default=False)

    class Meta:
        ordering = ['-date']
        indexes = [models.Index(fields=['student','subject','date'])]

    def __str__(self):
        return f"{self.student} - {self.subject} - {self.exam_name}: {self.score}/{self.max_score}"


class ResultSubmission(models.Model):
    """Grouped result submission from a teacher for review/publish."""

    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('published', 'Published'),
        ('rejected', 'Rejected'),
    )

    teacher = models.ForeignKey('users.Teacher', on_delete=models.CASCADE, related_name='result_submissions')
    class_assigned = models.ForeignKey('classes.Class', on_delete=models.CASCADE, related_name='result_submissions')
    subjects = models.ManyToManyField(Subject, related_name='result_submissions', blank=True)
    exam = models.ForeignKey('academics.Exam', on_delete=models.SET_NULL, null=True, blank=True, related_name='result_submissions')
    exam_title = models.CharField(max_length=200)
    max_score = models.FloatField(default=100)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='result_reviews')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_notes = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-submitted_at']

    def __str__(self):
        return f"{self.exam_title} - {self.class_assigned}"


class Exam(models.Model):
    """Exam schedule for a class/subject."""
    title = models.CharField(max_length=200)
    class_assigned = models.ForeignKey('classes.Class', on_delete=models.CASCADE, related_name='exams')
    subject = models.ForeignKey(Subject, on_delete=models.SET_NULL, null=True, blank=True, related_name='exams')
    exam_fee = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    date = models.DateField()
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    description = models.TextField(blank=True, null=True)
    invigilator = models.ForeignKey('users.Teacher', on_delete=models.SET_NULL, null=True, blank=True, related_name='invigilations')
    published = models.BooleanField(default=False)

    class Meta:
        ordering = ['date', 'start_time']

    def __str__(self):
        return f"{self.title} - {self.class_assigned} ({self.date})"
