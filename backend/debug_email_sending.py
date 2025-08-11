#!/usr/bin/env python
"""
Debug script to test email sending process step by step
"""
import os
import django
import logging

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'coffee_meetings_platform.settings')
django.setup()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from matching.models import EmployeePair, Campaign
from matching.services import EmailNotificationService
from django.core.mail import send_mail
from django.conf import settings

def test_email_configuration():
    """Test basic email configuration"""
    print("🔍 Testing Email Configuration...")
    print(f"EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
    print(f"EMAIL_HOST: {settings.EMAIL_HOST}")
    print(f"EMAIL_PORT: {settings.EMAIL_PORT}")
    print(f"EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}")
    print(f"EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")
    print(f"DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")
    print(f"EMAIL_TIMEOUT: {settings.EMAIL_TIMEOUT}")
    print()

def test_simple_email():
    """Test sending a simple email"""
    print("📧 Testing Simple Email...")
    try:
        result = send_mail(
            subject="Test Email - Coffee Meetings Platform",
            message="This is a test email to verify SMTP configuration.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=["test@example.com"],
            fail_silently=False,
        )
        print(f"✅ Simple email test result: {result}")
        return True
    except Exception as e:
        print(f"❌ Simple email test failed: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        print(f"Full traceback: {traceback.format_exc()}")
        return False

def test_email_service_initialization():
    """Test EmailNotificationService initialization"""
    print("🔧 Testing EmailNotificationService Initialization...")
    try:
        email_service = EmailNotificationService()
        print(f"✅ EmailNotificationService initialized successfully")
        print(f"From email: {email_service.from_email}")
        return email_service
    except Exception as e:
        print(f"❌ EmailNotificationService initialization failed: {str(e)}")
        import traceback
        print(f"Full traceback: {traceback.format_exc()}")
        return None

def test_evaluation_token_creation():
    """Test evaluation token creation"""
    print("🎫 Testing Evaluation Token Creation...")
    try:
        # Get a sample campaign and pair
        campaign = Campaign.objects.first()
        if not campaign:
            print("❌ No campaigns found in database")
            return None
            
        pair = EmployeePair.objects.filter(campaign=campaign).first()
        if not pair:
            print("❌ No pairs found for campaign")
            return None
            
        print(f"✅ Found campaign: {campaign.title}")
        print(f"✅ Found pair: {pair.employee1.name} & {pair.employee2.name}")
        
        # Test evaluation token creation
        email_service = EmailNotificationService()
        tokens = email_service._create_evaluation_tokens(pair)
        
        print(f"✅ Evaluation tokens created: {tokens}")
        return pair, tokens
        
    except Exception as e:
        print(f"❌ Evaluation token creation failed: {str(e)}")
        import traceback
        print(f"Full traceback: {traceback.format_exc()}")
        return None

def test_email_sending_for_pair():
    """Test email sending for a specific pair"""
    print("📧 Testing Email Sending for Pair...")
    try:
        # Get a sample pair
        campaign = Campaign.objects.first()
        if not campaign:
            print("❌ No campaigns found in database")
            return False
            
        pair = EmployeePair.objects.filter(campaign=campaign).first()
        if not pair:
            print("❌ No pairs found for campaign")
            return False
            
        print(f"✅ Testing with pair: {pair.employee1.name} & {pair.employee2.name}")
        
        # Test email sending
        email_service = EmailNotificationService()
        success = email_service._send_pair_notification(pair)
        
        print(f"✅ Email sending result: {success}")
        return success
        
    except Exception as e:
        print(f"❌ Email sending test failed: {str(e)}")
        import traceback
        print(f"Full traceback: {traceback.format_exc()}")
        return False

def test_bulk_email_sending():
    """Test bulk email sending"""
    print("📦 Testing Bulk Email Sending...")
    try:
        # Get all pairs from a campaign
        campaign = Campaign.objects.first()
        if not campaign:
            print("❌ No campaigns found in database")
            return False
            
        pairs = EmployeePair.objects.filter(campaign=campaign)[:5]  # Limit to 5 pairs
        if not pairs:
            print("❌ No pairs found for campaign")
            return False
            
        print(f"✅ Testing with {len(pairs)} pairs from campaign: {campaign.title}")
        
        # Test bulk email sending
        email_service = EmailNotificationService()
        results = email_service.send_pair_notifications(pairs)
        
        print(f"✅ Bulk email sending results: {results}")
        return results
        
    except Exception as e:
        print(f"❌ Bulk email sending test failed: {str(e)}")
        import traceback
        print(f"Full traceback: {traceback.format_exc()}")
        return False

def main():
    """Run all tests"""
    print("🚀 Starting Email Sending Debug Tests...")
    print("=" * 60)
    
    # Test 1: Email configuration
    test_email_configuration()
    print()
    
    # Test 2: Simple email
    simple_email_success = test_simple_email()
    print()
    
    if not simple_email_success:
        print("❌ Basic email configuration failed. Stopping tests.")
        return
    
    # Test 3: Service initialization
    email_service = test_email_service_initialization()
    print()
    
    if not email_service:
        print("❌ Email service initialization failed. Stopping tests.")
        return
    
    # Test 4: Evaluation token creation
    token_result = test_evaluation_token_creation()
    print()
    
    if not token_result:
        print("❌ Evaluation token creation failed. Stopping tests.")
        return
    
    # Test 5: Individual pair email
    pair_email_success = test_email_sending_for_pair()
    print()
    
    # Test 6: Bulk email sending
    bulk_results = test_bulk_email_sending()
    print()
    
    print("=" * 60)
    print("🎯 Debug Tests Summary:")
    print(f"✅ Basic email config: {'PASS' if simple_email_success else 'FAIL'}")
    print(f"✅ Service init: {'PASS' if email_service else 'FAIL'}")
    print(f"✅ Token creation: {'PASS' if token_result else 'FAIL'}")
    print(f"✅ Pair email: {'PASS' if pair_email_success else 'FAIL'}")
    print(f"✅ Bulk email: {'PASS' if bulk_results else 'FAIL'}")

if __name__ == "__main__":
    main()
