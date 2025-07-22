#!/usr/bin/env python
"""
Test script to verify the profile GET endpoint works correctly
"""
import os
import sys
import django
import requests
import json

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'coffee_meetings_platform.settings')
django.setup()

from users.models import HRManager
from django.contrib.auth.hashers import make_password

def test_profile_endpoint():
    """Test the profile endpoint with a sample user"""
    
    # Base URL - adjust if your server runs on a different port
    BASE_URL = "http://localhost:8000"
    
    # Test data
    test_user_data = {
        "name": "Test HR Manager",
        "email": "test@example.com",
        "password": "TestPassword123",
        "company_name": "Test Company"
    }
    
    print("🧪 Testing Profile GET Endpoint")
    print("=" * 50)
    
    try:
        # Step 1: Register a test user
        print("1. Registering test user...")
        register_response = requests.post(
            f"{BASE_URL}/users/register/",
            json=test_user_data,
            headers={"Content-Type": "application/json"}
        )
        
        if register_response.status_code == 201:
            print("✅ User registered successfully")
            register_data = register_response.json()
            access_token = register_data.get('token')
        else:
            # Try to login if user already exists
            print("ℹ️  User might already exist, trying to login...")
            login_response = requests.post(
                f"{BASE_URL}/users/login/",
                json={
                    "email": test_user_data["email"],
                    "password": test_user_data["password"]
                },
                headers={"Content-Type": "application/json"}
            )
            
            if login_response.status_code == 200:
                print("✅ User logged in successfully")
                login_data = login_response.json()
                access_token = login_data.get('access_token')
            else:
                print(f"❌ Login failed: {login_response.status_code}")
                print(f"Response: {login_response.text}")
                return
        
        # Step 2: Test profile GET endpoint
        print("\n2. Testing profile GET endpoint...")
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        profile_response = requests.get(
            f"{BASE_URL}/users/profile/",
            headers=headers
        )
        
        print(f"Status Code: {profile_response.status_code}")
        
        if profile_response.status_code == 200:
            print("✅ Profile GET request successful!")
            profile_data = profile_response.json()
            print("Profile Data:")
            print(json.dumps(profile_data, indent=2))
        else:
            print(f"❌ Profile GET request failed")
            print(f"Response: {profile_response.text}")
            
        # Step 3: Test profile UPDATE endpoint
        print("\n3. Testing profile UPDATE endpoint...")
        update_data = {
            "name": "Updated HR Manager",
            "company_name": "Updated Company"
        }
        
        update_response = requests.patch(
            f"{BASE_URL}/users/profile/",
            json=update_data,
            headers=headers
        )
        
        print(f"Status Code: {update_response.status_code}")
        
        if update_response.status_code == 200:
            print("✅ Profile UPDATE request successful!")
            updated_data = update_response.json()
            print("Updated Profile Data:")
            print(json.dumps(updated_data, indent=2))
        else:
            print(f"❌ Profile UPDATE request failed")
            print(f"Response: {update_response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection error. Make sure your Django server is running on http://localhost:8000")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    test_profile_endpoint()
