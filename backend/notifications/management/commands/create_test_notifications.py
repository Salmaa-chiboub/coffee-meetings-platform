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
                'title': 'Campagne Créée avec Succès',
                'message': 'Votre campagne "Renforcement d\'équipe T1" a été créée et est prête à être lancée.',
                'type': 'campaign',
                'priority': 'medium'
            },
            {
                'title': 'Nouvelle Évaluation Terminée',
                'message': 'Jean Dupont a terminé son évaluation de rencontre café.',
                'type': 'evaluation',
                'priority': 'low'
            },
            {
                'title': 'Campagne Terminée',
                'message': 'La campagne "Connexions Décembre" s\'est terminée avec succès avec un taux de participation de 85%.',
                'type': 'campaign',
                'priority': 'low'
            },
            {
                'title': 'Mise à Jour Système',
                'message': 'La plateforme CoffeeMeet a été mise à jour avec de nouvelles fonctionnalités et améliorations.',
                'type': 'system',
                'priority': 'medium'
            },
            {
                'title': 'Nouvel Employé Ajouté',
                'message': 'Sarah Martin a été ajoutée à votre base de données d\'employés.',
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
