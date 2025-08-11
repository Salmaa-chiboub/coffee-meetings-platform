#!/usr/bin/env python3
"""
Script to check if pairs were created in the database
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'coffee_meetings_platform.settings')
django.setup()

from matching.models import EmployeePair
from campaigns.models import Campaign

def check_pairs():
    """Check if pairs exist in the database"""
    try:
        # Check campaign 108
        campaign = Campaign.objects.get(id=108)
        print(f"✅ Found campaign: {campaign.title}")
        
        # Check all pairs for this campaign
        pairs = EmployeePair.objects.filter(campaign=campaign)
        print(f"📊 Total pairs in campaign: {pairs.count()}")
        
        for pair in pairs:
            print(f"  - Pair {pair.id}: {pair.employee1.name} & {pair.employee2.name}")
            print(f"    Created at: {pair.created_at}")
            print(f"    Created by: {pair.created_by}")
        
        # Check all pairs in the system
        all_pairs = EmployeePair.objects.all()
        print(f"\n🌍 Total pairs in system: {all_pairs.count()}")
        
        for pair in all_pairs:
            print(f"  - Pair {pair.id}: {pair.employee1.name} & {pair.employee2.name}")
            print(f"    Campaign: {pair.campaign.title}")
            print(f"    Created at: {pair.created_at}")
        
    except Campaign.DoesNotExist:
        print("❌ Campaign 108 not found")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    check_pairs()
