import os
import django
from decouple import config

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

# Check environment mode
MODE = config('MODE', default='development')

if MODE == 'production':
    print('⚠️  Production mode detected. Skipping test user creation.')
    exit(0)

from django.contrib.auth import get_user_model
from users.models import Teacher, Student
from classes.models import Class

User = get_user_model()

print("Creating test users...")

# Create test teacher
if not User.objects.filter(email='teacher@test.com').exists():
    teacher_user = User.objects.create_user(
        username='teacher1',
        email='teacher@test.com',
        password='password123',
        first_name='John',
        last_name='Teacher',
        phone='01712345678',
        role='teacher',
        status='approved'
    )
    teacher_user.is_active = True
    teacher_user.save()
    
    # Create teacher profile
    Teacher.objects.create(
        user=teacher_user,
        nid='1234567890123'
    )
    print('✅ Teacher created: teacher@test.com / password123')
else:
    print('⚠️  Teacher already exists')

# Create test student
if not User.objects.filter(email='student@test.com').exists():
    student_user = User.objects.create_user(
        username='student1',
        email='student@test.com',
        password='password123',
        first_name='Jane',
        last_name='Student',
        phone='01712345679',
        role='student',
        status='approved'
    )
    student_user.is_active = True
    student_user.save()
    
    # Create student profile
    Student.objects.create(
        user=student_user,
        student_class=None  # No class assigned yet
    )
    print('✅ Student created: student@test.com / password123')
else:
    print('⚠️  Student already exists')

print('\n✅ Test users created successfully!')
print('\n📝 Login Credentials:')
print('Admin:   admin@school.com / admin123')
print('Teacher: teacher@test.com / password123')
print('Student: student@test.com / password123')
