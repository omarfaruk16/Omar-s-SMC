import os
import django
from decouple import config

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# Check environment mode
MODE = config('MODE', default='development')

# Get admin credentials from env or use defaults
ADMIN_EMAIL = config('DJANGO_SUPERUSER_EMAIL', default='admin@school.com')
ADMIN_USERNAME = config('DJANGO_SUPERUSER_USERNAME', default='admin')
ADMIN_PASSWORD = config('DJANGO_SUPERUSER_PASSWORD', default='admin123')

# Create admin user if it doesn't exist
if not User.objects.filter(email=ADMIN_EMAIL).exists():
    admin = User.objects.create_superuser(
        username=ADMIN_USERNAME,
        email=ADMIN_EMAIL,
        password=ADMIN_PASSWORD,
        first_name='Admin',
        last_name='User',
        role='admin'
    )
    admin.status = 'approved'
    admin.save()
    
    if MODE != 'production':
        print('✅ Admin user created successfully!')
        print(f'Email: {ADMIN_EMAIL}')
        print(f'Password: {ADMIN_PASSWORD}')
        print('Role: admin')
    else:
        print('✅ Admin user created successfully (Production mode - credentials hidden).')

else:
    # Update existing admin password ONLY if NOT in production
    if MODE != 'production':
        admin = User.objects.get(email=ADMIN_EMAIL)
        admin.set_password(ADMIN_PASSWORD)
        admin.is_superuser = True
        admin.is_staff = True
        admin.role = 'admin'
        admin.status = 'approved'
        admin.save()
        print('✅ Admin user password updated!')
        print(f'Email: {ADMIN_EMAIL}')
        print(f'Password: {ADMIN_PASSWORD}')
        print('Role: admin')
    else:
        print('ℹ️  Admin user already exists. Skipping password reset in production.')
