#!/usr/bin/env python
"""
Test script to verify the change password functionality for authenticated users
"""
import requests
import json

def test_change_password_flow():
    """Test the complete change password flow for authenticated users"""
    
    BASE_URL = "http://localhost:8000"
    
    # Test user data
    test_user_data = {
        "email": "reset@example.com",
        "password": "NewPassword456"
    }
    
    new_password = "NewSecurePassword456"
    
    print("🔐 Testing Change Password Functionality (Authenticated User)")
    print("=" * 60)
    
    try:
        # Step 1: Login to get access token
        print("1. Logging in to get access token...")
        login_response = requests.post(
            f"{BASE_URL}/users/login/",
            json=test_user_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Login Status Code: {login_response.status_code}")
        
        if login_response.status_code == 200:
            print("✅ Login successful!")
            login_data = login_response.json()
            access_token = login_data.get('access_token')
            
            if access_token:
                print(f"🔑 Access token received: {access_token[:50]}...")
                
                # Step 2: Test change password
                print("\n2. Testing change password...")
                headers = {
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json"
                }
                
                change_password_data = {
                    "current_password": test_user_data["password"],
                    "new_password": new_password,
                    "confirm_password": new_password
                }
                
                change_response = requests.post(
                    f"{BASE_URL}/users/change-password/",
                    json=change_password_data,
                    headers=headers
                )
                
                print(f"Change Password Status Code: {change_response.status_code}")
                
                if change_response.status_code == 200:
                    print("✅ Password changed successfully!")
                    change_data = change_response.json()
                    print(f"Response: {change_data}")
                    
                    # Step 3: Test login with new password
                    print("\n3. Testing login with new password...")
                    new_login_data = {
                        "email": test_user_data["email"],
                        "password": new_password
                    }
                    
                    new_login_response = requests.post(
                        f"{BASE_URL}/users/login/",
                        json=new_login_data,
                        headers={"Content-Type": "application/json"}
                    )
                    
                    print(f"New Login Status Code: {new_login_response.status_code}")
                    
                    if new_login_response.status_code == 200:
                        print("✅ Login with new password successful!")
                        new_login_result = new_login_response.json()
                        print(f"New access token: {new_login_result.get('access_token', 'N/A')[:50]}...")
                    else:
                        print("❌ Login with new password failed")
                        print(f"Response: {new_login_response.text}")
                    
                    # Step 4: Test that old password no longer works
                    print("\n4. Testing that old password no longer works...")
                    old_login_response = requests.post(
                        f"{BASE_URL}/users/login/",
                        json=test_user_data,
                        headers={"Content-Type": "application/json"}
                    )
                    
                    if old_login_response.status_code != 200:
                        print("✅ Old password correctly rejected")
                    else:
                        print("❌ Old password still works (this is a problem)")
                        
                else:
                    print("❌ Password change failed")
                    print(f"Response: {change_response.text}")
                    
            else:
                print("❌ No access token received")
                
        else:
            print("❌ Login failed")
            print(f"Response: {login_response.text}")
            return
            
        # Step 5: Test error scenarios
        print("\n5. Testing error scenarios...")
        
        # Get new access token for error tests
        new_login_response = requests.post(
            f"{BASE_URL}/users/login/",
            json={"email": test_user_data["email"], "password": new_password},
            headers={"Content-Type": "application/json"}
        )
        
        if new_login_response.status_code == 200:
            new_token = new_login_response.json().get('access_token')
            headers = {
                "Authorization": f"Bearer {new_token}",
                "Content-Type": "application/json"
            }
            
            # Test wrong current password
            print("   5a. Testing with wrong current password...")
            wrong_current_response = requests.post(
                f"{BASE_URL}/users/change-password/",
                json={
                    "current_password": "WrongPassword123",
                    "new_password": "AnotherNewPassword789",
                    "confirm_password": "AnotherNewPassword789"
                },
                headers=headers
            )
            
            if wrong_current_response.status_code == 400:
                print("   ✅ Wrong current password correctly rejected")
            else:
                print("   ❌ Wrong current password not properly handled")
                
            # Test password mismatch
            print("   5b. Testing password confirmation mismatch...")
            mismatch_response = requests.post(
                f"{BASE_URL}/users/change-password/",
                json={
                    "current_password": new_password,
                    "new_password": "AnotherNewPassword789",
                    "confirm_password": "DifferentPassword123"
                },
                headers=headers
            )
            
            if mismatch_response.status_code == 400:
                print("   ✅ Password mismatch correctly rejected")
            else:
                print("   ❌ Password mismatch not properly handled")
                
            # Test same password
            print("   5c. Testing same password as current...")
            same_password_response = requests.post(
                f"{BASE_URL}/users/change-password/",
                json={
                    "current_password": new_password,
                    "new_password": new_password,
                    "confirm_password": new_password
                },
                headers=headers
            )
            
            if same_password_response.status_code == 400:
                print("   ✅ Same password correctly rejected")
            else:
                print("   ❌ Same password not properly handled")
                
        # Test without authentication
        print("   5d. Testing without authentication...")
        no_auth_response = requests.post(
            f"{BASE_URL}/users/change-password/",
            json={
                "current_password": new_password,
                "new_password": "AnotherPassword123",
                "confirm_password": "AnotherPassword123"
            },
            headers={"Content-Type": "application/json"}
        )
        
        if no_auth_response.status_code in [401, 403]:
            print("   ✅ Unauthenticated request correctly rejected")
        else:
            print("   ❌ Unauthenticated request not properly handled")
            
        print("\n🎉 Change password functionality test completed!")
        
    except requests.exceptions.ConnectionError:
        print("❌ Connection error. Make sure your Django server is running on http://localhost:8000")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    test_change_password_flow()
