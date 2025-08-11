#!/usr/bin/env python3
"""
Script to set password for test user
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'coffee_meetings_platform.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

def set_password():
    """Set password for test user"""
    try:
        user = User.objects.get(username='testuser2')
        user.set_password('testpass123')
        user.save()
        print(f"✅ Password set successfully for user: {user.username}")
        print(f"Username: {user.username}")
        print(f"Password: testpass123")
    except User.DoesNotExist:
        print("❌ User 'testuser2' not found")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    set_password()
