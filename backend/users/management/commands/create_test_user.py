from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from users.models import HRManager


class Command(BaseCommand):
    help = 'Create a test user for development and testing'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            default='test@coffeemeet.com',
            help='Email for the test user (default: test@coffeemeet.com)'
        )
        parser.add_argument(
            '--password',
            type=str,
            default='password123',
            help='Password for the test user (default: password123)'
        )
        parser.add_argument(
            '--name',
            type=str,
            default='Test User',
            help='Name for the test user (default: Test User)'
        )
        parser.add_argument(
            '--company',
            type=str,
            default='CoffeeMeet Demo Company',
            help='Company name for the test user (default: CoffeeMeet Demo Company)'
        )

    def handle(self, *args, **options):
        email = options['email']
        password = options['password']
        name = options['name']
        company = options['company']

        # Check if user already exists
        if HRManager.objects.filter(email=email).exists():
            self.stdout.write(
                self.style.WARNING(f'User with email {email} already exists!')
            )
            user = HRManager.objects.get(email=email)
            self.stdout.write(f'Existing user: {user.name} ({user.email})')
            return

        # Create the test user
        try:
            user = HRManager.objects.create(
                name=name,
                email=email,
                password_hash=make_password(password),
                company_name=company
            )
            
            self.stdout.write(
                self.style.SUCCESS(f'Successfully created test user!')
            )
            self.stdout.write(f'Email: {email}')
            self.stdout.write(f'Password: {password}')
            self.stdout.write(f'Name: {name}')
            self.stdout.write(f'Company: {company}')
            self.stdout.write('')
            self.stdout.write(
                self.style.SUCCESS('You can now login with these credentials!')
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error creating test user: {str(e)}')
            )
