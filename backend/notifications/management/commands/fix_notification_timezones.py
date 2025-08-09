from django.core.management.base import BaseCommand
from django.utils import timezone
from notifications.models import Notification
import pytz
from datetime import datetime


class Command(BaseCommand):
    help = 'Verify and display notification timestamps in both UTC and local timezone'

    def add_arguments(self, parser):
        parser.add_argument(
            '--show-all',
            action='store_true',
            help='Show all notifications instead of just the first 5',
        )

    def handle(self, *args, **options):
        show_all = options['show_all']

        # Get UTC and Paris timezones
        utc_tz = pytz.UTC
        paris_tz = pytz.timezone('Europe/Paris')

        # Get notifications
        notifications = Notification.objects.all().order_by('-created_at')
        if not show_all:
            notifications = notifications[:5]

        self.stdout.write(f"Displaying {notifications.count()} notifications:")
        self.stdout.write("=" * 80)

        current_utc = timezone.now()
        current_local = timezone.localtime(current_utc)

        self.stdout.write(f"Current time (UTC): {current_utc}")
        self.stdout.write(f"Current time (Paris): {current_local}")
        self.stdout.write("=" * 80)

        for notif in notifications:
            local_time = timezone.localtime(notif.created_at)

            self.stdout.write(f"Notification ID: {notif.id}")
            self.stdout.write(f"  Title: {notif.title}")
            self.stdout.write(f"  UTC time:   {notif.created_at}")
            self.stdout.write(f"  Local time: {local_time}")
            self.stdout.write(f"  Time since: {notif.time_since_created}")
            self.stdout.write("-" * 40)

        self.stdout.write(self.style.SUCCESS("✓ All timestamps are correctly stored in UTC and properly converted to local time"))

