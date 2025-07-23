# tests/conftest.py
"""
Test configuration and fixtures

This module contains pytest configuration and shared fixtures
for the test suite. It provides common setup and teardown
functionality used across multiple test modules.
"""

import pytest
from django.test import TestCase
from django.db import transaction
from rest_framework.test import APIClient
from .utils import TestDataFactory


@pytest.fixture
def api_client():
    """Provide an API client for testing"""
    return APIClient()


@pytest.fixture
def hr_manager():
    """Provide a test HR Manager"""
    return TestDataFactory.create_hr_manager()


@pytest.fixture
def hr_manager_2():
    """Provide a second test HR Manager for multi-user tests"""
    return TestDataFactory.create_hr_manager(
        name="HR Manager 2",
        email="hr2@test.com",
        company="Company 2"
    )


@pytest.fixture
def campaign(hr_manager):
    """Provide a test Campaign"""
    return TestDataFactory.create_campaign(hr_manager)


@pytest.fixture
def employee():
    """Provide a test Employee"""
    return TestDataFactory.create_employee()


class BaseTestCase(TestCase):
    """
    Base test case class with common functionality
    
    This class provides common setup and utility methods
    that can be inherited by other test classes.
    """
    
    def setUp(self):
        """Common setup for all tests"""
        self.client = APIClient()
        self.factory = TestDataFactory()
    
    def tearDown(self):
        """Common cleanup for all tests"""
        # Clean up any test data if needed
        pass
    
    def authenticate_user(self, user):
        """Helper to authenticate a user"""
        self.client.force_authenticate(user=user)
    
    def create_test_hr_manager(self, **kwargs):
        """Create a test HR Manager with optional overrides"""
        defaults = {
            'name': 'Test HR Manager',
            'email': 'hr@test.com',
            'company': 'Test Company'
        }
        defaults.update(kwargs)
        return self.factory.create_hr_manager(**defaults)
    
    def create_test_campaign(self, hr_manager, **kwargs):
        """Create a test Campaign with optional overrides"""
        defaults = {
            'title': 'Test Campaign',
            'days_from_now': 1,
            'duration_days': 30
        }
        defaults.update(kwargs)
        return self.factory.create_campaign(hr_manager, **defaults)


# Test database configuration
class TestDatabaseMixin:
    """
    Mixin for test classes that need database isolation
    
    This mixin ensures that each test runs in a clean database state
    and provides utilities for database-related testing.
    """
    
    @classmethod
    def setUpClass(cls):
        """Set up test class with database configuration"""
        super().setUpClass()
        # Any class-level database setup can go here
    
    def setUp(self):
        """Set up each test with a clean database state"""
        super().setUp()
        # Ensure we start with a clean state
        self._clear_test_data()
    
    def tearDown(self):
        """Clean up after each test"""
        super().tearDown()
        # Clean up any test data
        self._clear_test_data()
    
    def _clear_test_data(self):
        """Clear test data from the database"""
        # This method can be overridden in subclasses
        # to provide specific cleanup logic
        pass


# Performance testing utilities
class PerformanceTestMixin:
    """
    Mixin for performance-related testing
    
    Provides utilities for measuring and asserting
    performance characteristics of the application.
    """
    
    def assert_query_count(self, expected_count):
        """Context manager to assert the number of database queries"""
        from django.test.utils import override_settings
        from django.db import connection
        
        return self.assertNumQueries(expected_count)
    
    def measure_time(self):
        """Context manager to measure execution time"""
        import time
        from contextlib import contextmanager
        
        @contextmanager
        def timer():
            start = time.time()
            yield
            end = time.time()
            self.execution_time = end - start
        
        return timer()


# Security testing utilities
class SecurityTestMixin:
    """
    Mixin for security-related testing
    
    Provides utilities for testing authentication,
    authorization, and other security features.
    """
    
    def assert_requires_authentication(self, url, method='GET', data=None):
        """Assert that an endpoint requires authentication"""
        from rest_framework import status
        
        # Test without authentication
        if method.upper() == 'GET':
            response = self.client.get(url)
        elif method.upper() == 'POST':
            response = self.client.post(url, data or {})
        elif method.upper() == 'PUT':
            response = self.client.put(url, data or {})
        elif method.upper() == 'PATCH':
            response = self.client.patch(url, data or {})
        elif method.upper() == 'DELETE':
            response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def assert_permission_denied(self, url, user, method='GET', data=None):
        """Assert that a user is denied access to an endpoint"""
        from rest_framework import status
        
        self.authenticate_user(user)
        
        if method.upper() == 'GET':
            response = self.client.get(url)
        elif method.upper() == 'POST':
            response = self.client.post(url, data or {})
        elif method.upper() == 'PUT':
            response = self.client.put(url, data or {})
        elif method.upper() == 'PATCH':
            response = self.client.patch(url, data or {})
        elif method.upper() == 'DELETE':
            response = self.client.delete(url)
        
        self.assertIn(response.status_code, [
            status.HTTP_403_FORBIDDEN,
            status.HTTP_404_NOT_FOUND
        ])
