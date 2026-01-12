from datetime import datetime, timedelta

from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from django.utils.dateparse import parse_datetime

from academics.models import TimetableSlot
from notifications.models import PushSubscription, NotificationLog
from notifications.services import send_web_push, WebPushError


class Command(BaseCommand):
    help = 'Send web push notifications 15 minutes before scheduled classes.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--now',
            dest='now',
            help='Override current time (YYYY-MM-DD HH:MM or ISO datetime).',
        )
        parser.add_argument(
            '--lead-minutes',
            dest='lead_minutes',
            type=int,
            default=15,
            help='Minutes before class start to send notification.',
        )
        parser.add_argument(
            '--tolerance-minutes',
            dest='tolerance_minutes',
            type=int,
            default=1,
            help='Tolerance window in minutes to avoid missing reminders.',
        )

    def handle(self, *args, **options):
        raw_now = options.get('now')
        lead_minutes = options.get('lead_minutes', 15)
        tolerance_minutes = options.get('tolerance_minutes', 1)

        if raw_now:
            parsed = parse_datetime(raw_now)
            if not parsed:
                raise CommandError('Invalid --now format. Use YYYY-MM-DD HH:MM or ISO datetime.')
            if timezone.is_naive(parsed):
                parsed = timezone.make_aware(parsed, timezone.get_current_timezone())
            now = timezone.localtime(parsed)
        else:
            now = timezone.localtime()

        now = now.replace(second=0, microsecond=0)
        target_dt = now + timedelta(minutes=lead_minutes)
        weekday = target_dt.weekday()
        window_start = (target_dt - timedelta(minutes=tolerance_minutes)).time().replace(second=0, microsecond=0)
        window_end = (target_dt + timedelta(minutes=tolerance_minutes)).time().replace(second=0, microsecond=0)

        slots = TimetableSlot.objects.select_related('teacher', 'subject', 'class_assigned').filter(
            weekday=weekday,
            teacher__isnull=False,
        )

        if window_start <= window_end:
            slots = slots.filter(start_time__gte=window_start, start_time__lte=window_end)
        else:
            slots = slots.filter(start_time__gte=window_start) | slots.filter(start_time__lte=window_end)

        if not slots.exists():
            self.stdout.write(
                f'No timetable slots found for reminder window {window_start.strftime("%H:%M")} - '
                f'{window_end.strftime("%H:%M")} on weekday {weekday}.'
            )
            return

        for slot in slots:
            teacher = slot.teacher
            class_start_dt = timezone.make_aware(
                datetime.combine(target_dt.date(), slot.start_time),
                timezone.get_current_timezone(),
            )
            if NotificationLog.objects.filter(
                teacher=teacher,
                timetable_slot=slot,
                scheduled_for=class_start_dt,
            ).exists():
                continue

            subscriptions = PushSubscription.objects.filter(teacher=teacher, is_active=True)
            if not subscriptions.exists():
                continue

            subject_name = slot.subject.name if slot.subject else 'Class'
            class_name = str(slot.class_assigned)
            start_label = slot.start_time.strftime('%I:%M %p').lstrip('0')

            payload = {
                'title': 'Class Reminder',
                'body': f"{subject_name} for {class_name} starts at {start_label}.",
                'url': '/teacher/timetable',
                'icon': '/rozey-mozammel-womens-college-logo.png',
                'badge': '/rozey-mozammel-womens-college-logo.png',
            }

            errors = []
            success = False
            for subscription in subscriptions:
                try:
                    send_web_push(subscription, payload)
                    success = True
                except WebPushError as exc:
                    errors.append(str(exc))
                    if exc.status_code in (404, 410):
                        subscription.is_active = False
                        subscription.save(update_fields=['is_active', 'updated_at'])

            NotificationLog.objects.create(
                teacher=teacher,
                timetable_slot=slot,
                scheduled_for=class_start_dt,
                status='sent' if success else 'failed',
                payload=payload,
                error='; '.join(errors)[:1000],
            )

        self.stdout.write('Reminder notifications processed.')
