from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from notifications.services import NotificationService

User = get_user_model()


class Command(BaseCommand):
    help = 'Create test notifications for development'

    def add_arguments(self, parser):
        parser.add_argument(
            '--user-email',
            type=str,
            help='Email of the user to create notifications for',
        )
        parser.add_argument(
            '--count',
            type=int,
            default=5,
            help='Number of test notifications to create',
        )

    def handle(self, *args, **options):
        user_email = options.get('user_email')
        count = options.get('count', 5)

        if user_email:
            try:
                user = User.objects.get(email=user_email)
            except User.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'User with email {user_email} does not exist')
                )
                return
        else:
            # Get the first user
            user = User.objects.first()
            if not user:
                self.stdout.write(
                    self.style.ERROR('No users found. Please create a user first.')
                )
                return

        self.stdout.write(f'Creating {count} test notifications for user: {user.email}')

        # Create different types of test notifications
        test_notifications = [
            {
                'title': 'Campaign Created Successfully',
                'message': 'Your campaign "Q1 Team Building" has been created and is ready to launch.',
                'type': 'campaign',
                'priority': 'medium'
            },
            {
                'title': 'New Evaluation Completed',
                'message': 'John Doe has completed their coffee meeting evaluation.',
                'type': 'evaluation',
                'priority': 'low'
            },
            {
                'title': 'Campaign Ended',
                'message': 'Campaign "December Connections" has ended successfully with 85% participation rate.',
                'type': 'campaign',
                'priority': 'low'
            },
            {
                'title': 'System Update',
                'message': 'The CoffeeMeet platform has been updated with new features and improvements.',
                'type': 'system',
                'priority': 'medium'
            },
            {
                'title': 'New Employee Added',
                'message': 'Sarah Johnson has been added to your employee database.',
                'type': 'user',
                'priority': 'low'
            }
        ]

        created_count = 0
        for i in range(count):
            notification_data = test_notifications[i % len(test_notifications)]
            
            try:
                notification = NotificationService.create_notification(
                    recipient=user,
                    title=notification_data['title'],
                    message=notification_data['message'],
                    notification_type=notification_data['type'],
                    priority=notification_data['priority']
                )
                created_count += 1
                self.stdout.write(f'Created notification: {notification.title}')
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'Failed to create notification: {str(e)}')
                )

        self.stdout.write(
            self.style.SUCCESS(f'Successfully created {created_count} test notifications')
        )
