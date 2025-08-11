#!/usr/bin/env python3
"""
Script to setup test data for email flow testing
"""
import os
import django
import time

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'coffee_meetings_platform.settings')
django.setup()

from users.models import HRManager
from campaigns.models import Campaign
from employees.models import Employee

def setup_test_data():
    """Setup test campaign and employees"""
    try:
        # Create test HRManager
        hr_manager, created = HRManager.objects.get_or_create(
            email='testhr@example.com',
            defaults={
                'name': 'Test HR Manager',
                'password_hash': 'test_hash_123',
                'company_name': 'Test Company'
            }
        )
        
        if created:
            print(f"✅ Created test HR manager: {hr_manager.name} (ID: {hr_manager.id})")
        else:
            print(f"✅ Found existing HR manager: {hr_manager.name} (ID: {hr_manager.id})")
        
        # Create test campaign
        campaign, created = Campaign.objects.get_or_create(
            title=f"Test Campaign for Email Flow {int(time.time())}",
            defaults={
                'hr_manager': hr_manager,
                'description': 'Test campaign to debug email flow',
                'start_date': '2025-08-11',
                'end_date': '2025-08-25'
            }
        )
        
        if created:
            print(f"✅ Created test campaign: {campaign.title} (ID: {campaign.id})")
        else:
            print(f"✅ Found existing campaign: {campaign.title} (ID: {campaign.id})")
        
        # Create test employees
        emp1, created = Employee.objects.get_or_create(
            email='emp1@test.com',
            defaults={
                'name': 'Test Employee 1',
                'arrival_date': '2025-01-01',
                'campaign': campaign
            }
        )
        
        if created:
            print(f"✅ Created test employee 1: {emp1.name} (ID: {emp1.id})")
        else:
            print(f"✅ Found existing employee 1: {emp1.name} (ID: {emp1.id})")
        
        emp2, created = Employee.objects.get_or_create(
            email='emp2@test.com',
            defaults={
                'name': 'Test Employee 2',
                'arrival_date': '2025-01-01',
                'campaign': campaign
            }
        )
        
        if created:
            print(f"✅ Created test employee 2: {emp2.name} (ID: {emp2.id})")
        else:
            print(f"✅ Found existing employee 2: {emp2.name} (ID: {emp2.id})")
        
        print(f"\n📊 Test Data Summary:")
        print(f"HR Manager ID: {hr_manager.id}")
        print(f"Campaign ID: {campaign.id}")
        print(f"Employee 1 ID: {emp1.id}")
        print(f"Employee 2 ID: {emp2.id}")
        
        return campaign.id, emp1.id, emp2.id
        
    except Exception as e:
        print(f"❌ Error setting up test data: {str(e)}")
        return None, None, None

if __name__ == "__main__":
    setup_test_data()
