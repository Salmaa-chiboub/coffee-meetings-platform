#!/usr/bin/env python3
"""
Script to create JWT token for HRManager
"""
import os
import django
import jwt
from datetime import datetime, timedelta

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'coffee_meetings_platform.settings')
django.setup()

from django.conf import settings
from users.models import HRManager

def create_jwt_token():
    """Create JWT token for HRManager"""
    try:
        # Get the test HRManager
        hr_manager = HRManager.objects.get(email='testhr@example.com')
        print(f"✅ Found HR Manager: {hr_manager.name} (ID: {hr_manager.id})")
        
        # Create JWT payload
        payload = {
            'user_id': hr_manager.id,
            'email': hr_manager.email,
            'exp': datetime.utcnow() + timedelta(hours=24),  # Token expires in 24 hours
            'iat': datetime.utcnow()
        }
        
        # Generate JWT token
        token = jwt.encode(
            payload,
            settings.JWT_SECRET_KEY,
            algorithm=settings.JWT_ALGORITHM
        )
        
        print(f"✅ JWT Token created successfully")
        print(f"Token: {token}")
        
        return token
        
    except HRManager.DoesNotExist:
        print("❌ HR Manager not found")
        return None
    except Exception as e:
        print(f"❌ Error creating JWT token: {str(e)}")
        return None

if __name__ == "__main__":
    create_jwt_token()
