import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# Create admin user if it doesn't exist
if not User.objects.filter(email='admin@school.com').exists():
    admin = User.objects.create_superuser(
        username='admin',
        email='admin@school.com',
        password='admin123',
        first_name='Admin',
        last_name='User',
        role='admin'
    )
    admin.status = 'approved'
    admin.save()
    print('✅ Admin user created successfully!')
    print('Email: admin@school.com')
    print('Password: admin123')
    print('Role: admin')
else:
    # Update existing admin password
    admin = User.objects.get(email='admin@school.com')
    admin.set_password('admin123')
    admin.is_superuser = True
    admin.is_staff = True
    admin.role = 'admin'
    admin.status = 'approved'
    admin.save()
    print('✅ Admin user password updated!')
    print('Email: admin@school.com')
    print('Password: admin123')
    print('Role: admin')
