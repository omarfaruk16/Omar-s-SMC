from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from getpass import getpass
import re

User = get_user_model()


class Command(BaseCommand):
    help = 'Create a superuser with approved status (no pending approval needed)'

    def add_arguments(self, parser):
        parser.add_argument('--email', type=str, help='Email address')
        parser.add_argument('--username', type=str, help='Username')
        parser.add_argument('--password', type=str, help='Password (will prompt if not provided)')
        parser.add_argument('--first-name', type=str, default='', help='First name')
        parser.add_argument('--last-name', type=str, default='', help='Last name')

    def handle(self, *args, **options):
        email = options.get('email')
        username = options.get('username')
        password = options.get('password')
        first_name = options.get('first_name', '')
        last_name = options.get('last_name', '')

        # Prompt for email if not provided
        while not email:
            email = input('Email address: ').strip()
            if not email:
                self.stdout.write(self.style.ERROR('Email cannot be empty.'))
                continue
            if User.objects.filter(email=email).exists():
                self.stdout.write(self.style.ERROR(f'A user with email {email} already exists.'))
                email = None
                continue
            if not self._validate_email(email):
                self.stdout.write(self.style.ERROR('Invalid email format.'))
                email = None
                continue
            break

        # Prompt for username if not provided
        while not username:
            username = input('Username: ').strip()
            if not username:
                self.stdout.write(self.style.ERROR('Username cannot be empty.'))
                continue
            if User.objects.filter(username=username).exists():
                self.stdout.write(self.style.ERROR(f'A user with username {username} already exists.'))
                username = None
                continue
            break

        # Prompt for password if not provided
        while not password:
            password = getpass('Password: ')
            if not password:
                self.stdout.write(self.style.ERROR('Password cannot be empty.'))
                continue
            password_confirm = getpass('Password (again): ')
            if password != password_confirm:
                self.stdout.write(self.style.ERROR('Passwords do not match.'))
                password = None
                continue
            break

        # Prompt for first/last names if not provided
        if not first_name:
            first_name = input('First name (optional): ').strip()

        if not last_name:
            last_name = input('Last name (optional): ').strip()

        # Create superuser with approved status
        try:
            user = User.objects.create_superuser(
                email=email,
                username=username,
                password=password,
                first_name=first_name,
                last_name=last_name,
                role='admin',
                status='approved',  # ✅ This ensures immediate approval
            )

            self.stdout.write(
                self.style.SUCCESS(
                    f'\n✓ Successfully created approved superuser:\n'
                    f'  Email: {user.email}\n'
                    f'  Username: {user.username}\n'
                    f'  Name: {user.get_full_name() or "(no name)"}\n'
                    f'  Status: {user.get_status_display()}\n'
                    f'  Is Superuser: {user.is_superuser}\n'
                    f'  Is Staff: {user.is_staff}\n'
                )
            )
            self.stdout.write(
                self.style.SUCCESS(
                    '✅ User can now login immediately without waiting for admin approval!\n'
                )
            )
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error creating superuser: {str(e)}'))

    @staticmethod
    def _validate_email(email):
        """Simple email validation"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
