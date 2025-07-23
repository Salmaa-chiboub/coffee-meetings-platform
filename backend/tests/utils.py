# tests/utils.py
"""
Test utilities and helper functions

This module contains common utilities and helper functions used across
different test modules to reduce code duplication and improve maintainability.
"""

from users.models import HRManager
from campaigns.models import Campaign
from employees.models import Employee
from django.contrib.auth.hashers import make_password
from datetime import date, timedelta


class TestDataFactory:
    """Factory class for creating test data objects"""
    
    @staticmethod
    def create_hr_manager(name="Test HR Manager", email="hr@test.com", company="Test Company"):
        """Create a test HR Manager"""
        return HRManager.objects.create(
            name=name,
            email=email,
            password_hash=make_password('password123'),
            company_name=company
        )
    
    @staticmethod
    def create_campaign(hr_manager, title="Test Campaign", days_from_now=1, duration_days=30):
        """Create a test Campaign"""
        return Campaign.objects.create(
            title=title,
            description="Test Description",
            start_date=date.today() + timedelta(days=days_from_now),
            end_date=date.today() + timedelta(days=days_from_now + duration_days),
            hr_manager=hr_manager
        )
    
    @staticmethod
    def create_employee(name="Test Employee", email="employee@test.com"):
        """Create a test Employee"""
        return Employee.objects.create(
            name=name,
            email=email,
            arrival_date=date.today() - timedelta(days=30)
        )


class APITestMixin:
    """Mixin class providing common API test functionality"""
    
    def authenticate_user(self, user):
        """Helper method to authenticate a user for API tests"""
        self.client.force_authenticate(user=user)
    
    def get_campaign_list_url(self):
        """Get the URL for campaign list endpoint"""
        from django.urls import reverse
        return reverse('campaign-list')
    
    def get_campaign_detail_url(self, campaign_id):
        """Get the URL for campaign detail endpoint"""
        from django.urls import reverse
        return reverse('campaign-detail', args=[campaign_id])


class DateTestHelpers:
    """Helper functions for date-related tests"""
    
    @staticmethod
    def get_future_date(days=1):
        """Get a date in the future"""
        return date.today() + timedelta(days=days)
    
    @staticmethod
    def get_past_date(days=1):
        """Get a date in the past"""
        return date.today() - timedelta(days=days)
    
    @staticmethod
    def get_date_range(start_days=1, duration_days=30):
        """Get a valid date range for campaigns"""
        start_date = date.today() + timedelta(days=start_days)
        end_date = start_date + timedelta(days=duration_days)
        return start_date, end_date
    
    @staticmethod
    def get_invalid_date_range():
        """Get an invalid date range (end_date < start_date)"""
        start_date = date.today() + timedelta(days=30)
        end_date = date.today() + timedelta(days=1)
        return start_date, end_date


class ValidationTestHelpers:
    """Helper functions for validation tests"""
    
    @staticmethod
    def get_valid_campaign_data():
        """Get valid campaign data for API tests"""
        start_date, end_date = DateTestHelpers.get_date_range()
        return {
            "title": "Test Campaign",
            "description": "Test Description",
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat()
        }
    
    @staticmethod
    def get_invalid_campaign_data():
        """Get invalid campaign data for API tests"""
        start_date, end_date = DateTestHelpers.get_invalid_date_range()
        return {
            "title": "Invalid Campaign",
            "description": "Test Description",
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat()
        }


class AssertionHelpers:
    """Helper functions for common test assertions"""
    
    @staticmethod
    def assert_campaign_data_matches(test_case, campaign, expected_data):
        """Assert that campaign data matches expected values"""
        test_case.assertEqual(campaign.title, expected_data.get('title'))
        if 'description' in expected_data:
            test_case.assertEqual(campaign.description, expected_data.get('description'))
    
    @staticmethod
    def assert_response_has_error(test_case, response, field_name=None):
        """Assert that response contains validation errors"""
        test_case.assertGreaterEqual(response.status_code, 400)
        test_case.assertLess(response.status_code, 500)
        if field_name:
            test_case.assertIn(field_name, response.data)
    
    @staticmethod
    def assert_unauthorized_response(test_case, response):
        """Assert that response indicates unauthorized access"""
        from rest_framework import status
        test_case.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    @staticmethod
    def assert_forbidden_response(test_case, response):
        """Assert that response indicates forbidden access"""
        from rest_framework import status
        test_case.assertIn(response.status_code, [
            status.HTTP_403_FORBIDDEN,
            status.HTTP_404_NOT_FOUND  # 404 is returned when object is filtered out
        ])


# Convenience imports for test modules
__all__ = [
    'TestDataFactory',
    'APITestMixin',
    'DateTestHelpers',
    'ValidationTestHelpers',
    'AssertionHelpers'
]
