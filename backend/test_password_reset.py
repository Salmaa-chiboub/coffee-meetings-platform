#!/usr/bin/env python
"""
Test script to verify the password reset functionality works correctly
"""
import os
import sys
import django
import requests
import json
import time

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'coffee_meetings_platform.settings')
django.setup()

from users.models import HRManager, PasswordResetToken
from django.contrib.auth.hashers import make_password

def test_password_reset_flow():
    """Test the complete password reset flow"""
    
    BASE_URL = "http://localhost:8000"
    
    # Test user data
    test_user_data = {
        "name": "Test Reset User",
        "email": "reset@example.com",
        "password": "OldPassword123",
        "company_name": "Reset Test Company"
    }
    
    new_password = "NewPassword456"
    
    print("🔐 Testing Password Reset Functionality")
    print("=" * 50)
    
    try:
        # Step 1: Create or ensure test user exists
        print("1. Setting up test user...")
        
        # Try to create user first
        register_response = requests.post(
            f"{BASE_URL}/users/register/",
            json=test_user_data,
            headers={"Content-Type": "application/json"}
        )
        
        if register_response.status_code == 201:
            print("✅ Test user created successfully")
        else:
            print("ℹ️  Test user might already exist")
        
        # Step 2: Test password reset request
        print("\n2. Testing password reset request...")
        reset_request_data = {
            "email": test_user_data["email"]
        }
        
        reset_request_response = requests.post(
            f"{BASE_URL}/users/password-reset-request/",
            json=reset_request_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Reset Request Status Code: {reset_request_response.status_code}")
        
        if reset_request_response.status_code == 200:
            print("✅ Password reset request successful!")
            reset_data = reset_request_response.json()
            print(f"Response: {reset_data}")
            
            # Step 3: Get the reset token from database (simulating email click)
            print("\n3. Retrieving reset token from database...")
            try:
                user = HRManager.objects.get(email=test_user_data["email"])
                reset_token = PasswordResetToken.objects.filter(
                    user=user, 
                    is_used=False
                ).order_by('-created_at').first()
                
                if reset_token:
                    print(f"✅ Reset token found: {reset_token.token}")
                    
                    # Step 4: Test password reset confirmation
                    print("\n4. Testing password reset confirmation...")
                    reset_confirm_data = {
                        "token": str(reset_token.token),
                        "new_password": new_password,
                        "confirm_password": new_password
                    }
                    
                    reset_confirm_response = requests.post(
                        f"{BASE_URL}/users/password-reset-confirm/",
                        json=reset_confirm_data,
                        headers={"Content-Type": "application/json"}
                    )
                    
                    print(f"Reset Confirm Status Code: {reset_confirm_response.status_code}")
                    
                    if reset_confirm_response.status_code == 200:
                        print("✅ Password reset confirmation successful!")
                        confirm_data = reset_confirm_response.json()
                        print(f"Response: {confirm_data}")
                        
                        # Step 5: Test login with new password
                        print("\n5. Testing login with new password...")
                        login_data = {
                            "email": test_user_data["email"],
                            "password": new_password
                        }
                        
                        login_response = requests.post(
                            f"{BASE_URL}/users/login/",
                            json=login_data,
                            headers={"Content-Type": "application/json"}
                        )
                        
                        print(f"Login Status Code: {login_response.status_code}")
                        
                        if login_response.status_code == 200:
                            print("✅ Login with new password successful!")
                            login_result = login_response.json()
                            print(f"Access token received: {login_result.get('access_token', 'N/A')[:50]}...")
                        else:
                            print("❌ Login with new password failed")
                            print(f"Response: {login_response.text}")
                            
                        # Step 6: Test that old password no longer works
                        print("\n6. Testing that old password no longer works...")
                        old_login_data = {
                            "email": test_user_data["email"],
                            "password": test_user_data["password"]
                        }
                        
                        old_login_response = requests.post(
                            f"{BASE_URL}/users/login/",
                            json=old_login_data,
                            headers={"Content-Type": "application/json"}
                        )
                        
                        if old_login_response.status_code != 200:
                            print("✅ Old password correctly rejected")
                        else:
                            print("❌ Old password still works (this is a problem)")
                            
                    else:
                        print("❌ Password reset confirmation failed")
                        print(f"Response: {reset_confirm_response.text}")
                        
                else:
                    print("❌ No reset token found in database")
                    
            except Exception as e:
                print(f"❌ Error retrieving reset token: {str(e)}")
                
        else:
            print("❌ Password reset request failed")
            print(f"Response: {reset_request_response.text}")
            
        # Step 7: Test invalid scenarios
        print("\n7. Testing invalid scenarios...")
        
        # Test with invalid email
        print("   7a. Testing with invalid email...")
        invalid_email_response = requests.post(
            f"{BASE_URL}/users/password-reset-request/",
            json={"email": "nonexistent@example.com"},
            headers={"Content-Type": "application/json"}
        )
        
        if invalid_email_response.status_code == 400:
            print("   ✅ Invalid email correctly rejected")
        else:
            print("   ❌ Invalid email not properly handled")
            
        # Test with invalid token
        print("   7b. Testing with invalid token...")
        invalid_token_response = requests.post(
            f"{BASE_URL}/users/password-reset-confirm/",
            json={
                "token": "00000000-0000-0000-0000-000000000000",
                "new_password": "TestPassword123",
                "confirm_password": "TestPassword123"
            },
            headers={"Content-Type": "application/json"}
        )
        
        if invalid_token_response.status_code == 400:
            print("   ✅ Invalid token correctly rejected")
        else:
            print("   ❌ Invalid token not properly handled")
            
        print("\n🎉 Password reset functionality test completed!")
        
    except requests.exceptions.ConnectionError:
        print("❌ Connection error. Make sure your Django server is running on http://localhost:8000")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    test_password_reset_flow()
