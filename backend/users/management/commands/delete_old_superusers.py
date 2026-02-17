from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Delete all superusers (created with manage.py createsuperuser)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirm deletion without prompting',
        )

    def handle(self, *args, **options):
        superusers = User.objects.filter(is_superuser=True)
        count = superusers.count()

        if count == 0:
            self.stdout.write(self.style.SUCCESS('No superusers found to delete.'))
            return

        self.stdout.write(self.style.WARNING(f'Found {count} superuser(s):'))
        for user in superusers:
            self.stdout.write(f'  - {user.email} ({user.username})')

        if not options['confirm']:
            confirm = input('\n⚠️  Are you sure you want to delete these superusers? (yes/no): ')
            if confirm.lower() != 'yes':
                self.stdout.write(self.style.ERROR('Deletion cancelled.'))
                return

        superusers.delete()
        self.stdout.write(
            self.style.SUCCESS(f'✓ Successfully deleted {count} superuser(s).')
        )
