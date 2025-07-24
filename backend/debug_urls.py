#!/usr/bin/env python
"""
Script pour déboguer les URLs générées par le router
"""
import os
import sys
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'coffee_meetings_platform.settings')
django.setup()

from django.urls import include
from employees.urls import urlpatterns as employee_urlpatterns

def debug_router_urls():
    """Afficher les URLs générées par la configuration actuelle"""
    print("="*60)
    print("DEBUG DES URLS GÉNÉRÉES PAR LA CONFIGURATION ACTUELLE")
    print("="*60)

    print("\nURLs configurées dans employees/urls.py:")
    print("-" * 40)

    for url_pattern in employee_urlpatterns:
        print(f"Pattern: {url_pattern.pattern}")
        print(f"Name: {getattr(url_pattern, 'name', 'N/A')}")
        print(f"Callback: {getattr(url_pattern, 'callback', 'N/A')}")

        # Si c'est un include, afficher les sous-patterns
        if hasattr(url_pattern, 'url_patterns'):
            print(f"  Sous-patterns:")
            for sub_pattern in url_pattern.url_patterns:
                print(f"    {sub_pattern.pattern} -> {getattr(sub_pattern, 'name', 'N/A')}")
        print("-" * 40)
    
    print("\nTest de résolution d'URLs:")
    print("-" * 40)
    
    from django.urls import resolve, reverse
    from django.test import RequestFactory
    
    # Test des URLs problématiques
    test_urls = [
        '/employees/',
        '/employees/attributes/',
        '/employees/attributes/1/',
        '/employees/1/',
    ]
    
    for test_url in test_urls:
        try:
            resolved = resolve(test_url)
            print(f"✓ {test_url} -> {resolved.func.__name__} (view: {resolved.view_name})")
        except Exception as e:
            print(f"✗ {test_url} -> ERREUR: {e}")

if __name__ == "__main__":
    debug_router_urls()
