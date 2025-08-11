#!/usr/bin/env python3
"""
Script pour vérifier la configuration de production et identifier
les différences avec l'environnement de test
"""

import os
import sys
import django
from datetime import datetime

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'coffee_meetings_platform.settings')
django.setup()

from django.conf import settings
from django.core.mail import get_connection
from django.db import connection
from matching.models import EmployeePair, CampaignMatchingCriteria
from campaigns.models import Campaign
from employees.models import Employee

def check_database_connection():
    """Vérifier la connexion à la base de données"""
    print("🔍 Vérification de la connexion à la base de données...")
    
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT version();")
            version = cursor.fetchone()
            print(f"✅ Connexion DB réussie: {version[0]}")
            
            # Vérifier les tables
            cursor.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name IN ('matching_employeepair', 'campaigns_campaign', 'employees_employee')
                ORDER BY table_name;
            """)
            tables = cursor.fetchall()
            print(f"✅ Tables trouvées: {[t[0] for t in tables]}")
            
            return True
    except Exception as e:
        print(f"❌ Erreur connexion DB: {str(e)}")
        return False

def check_email_configuration():
    """Vérifier la configuration email complète"""
    print("\n🔍 Vérification de la configuration email...")
    
    try:
        # Configuration de base
        print(f"✅ EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
        print(f"✅ EMAIL_HOST: {getattr(settings, 'EMAIL_HOST', 'Non défini')}")
        print(f"✅ EMAIL_PORT: {getattr(settings, 'EMAIL_PORT', 'Non défini')}")
        print(f"✅ EMAIL_USE_TLS: {getattr(settings, 'EMAIL_USE_TLS', 'Non défini')}")
        print(f"✅ EMAIL_USE_SSL: {getattr(settings, 'EMAIL_USE_SSL', 'Non défini')}")
        print(f"✅ EMAIL_HOST_USER: {getattr(settings, 'EMAIL_HOST_USER', 'Non défini')}")
        print(f"✅ EMAIL_HOST_PASSWORD: {'***DÉFINI***' if getattr(settings, 'EMAIL_HOST_PASSWORD', None) else 'Non défini'}")
        print(f"✅ DEFAULT_FROM_EMAIL: {getattr(settings, 'DEFAULT_FROM_EMAIL', 'Non défini')}")
        
        # Test de connexion
        connection = get_connection()
        connection.open()
        print("✅ Test de connexion email réussi!")
        connection.close()
        
        return True
    except Exception as e:
        print(f"❌ Erreur configuration email: {str(e)}")
        return False

def check_environment_variables():
    """Vérifier les variables d'environnement"""
    print("\n🔍 Vérification des variables d'environnement...")
    
    email_vars = [
        'EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_HOST_USER', 'EMAIL_HOST_PASSWORD',
        'EMAIL_USE_TLS', 'EMAIL_USE_SSL', 'DEFAULT_FROM_EMAIL'
    ]
    
    for var in email_vars:
        value = os.environ.get(var)
        if value:
            if 'PASSWORD' in var:
                print(f"✅ {var}: ***DÉFINI***")
            else:
                print(f"✅ {var}: {value}")
        else:
            print(f"⚠️ {var}: Non défini")
    
    # Vérifier Django settings
    print(f"\n🔍 Vérification des settings Django...")
    print(f"✅ DEBUG: {getattr(settings, 'DEBUG', 'Non défini')}")
    print(f"✅ ALLOWED_HOSTS: {getattr(settings, 'ALLOWED_HOSTS', 'Non défini')}")
    
    return True

def check_database_data():
    """Vérifier les données de la base de données"""
    print("\n🔍 Vérification des données de la base de données...")
    
    try:
        # Compter les objets
        campaigns_count = Campaign.objects.count()
        employees_count = Employee.objects.count()
        pairs_count = EmployeePair.objects.count()
        
        print(f"✅ Campagnes: {campaigns_count}")
        print(f"✅ Employés: {employees_count}")
        print(f"✅ Paires: {pairs_count}")
        
        if pairs_count > 0:
            # Analyser les paires
            sent_pairs = EmployeePair.objects.filter(email_sent=True).count()
            pending_pairs = EmployeePair.objects.filter(email_sent=False).count()
            
            print(f"✅ Paires avec email_sent=True: {sent_pairs}")
            print(f"✅ Paires avec email_sent=False: {pending_pairs}")
            
            # Vérifier la cohérence
            inconsistent = EmployeePair.objects.filter(
                email_status='sent', email_sent=False
            ).count()
            
            if inconsistent > 0:
                print(f"⚠️ Paires incohérentes (status='sent' mais email_sent=False): {inconsistent}")
            else:
                print("✅ Toutes les paires sont cohérentes")
        
        return True
    except Exception as e:
        print(f"❌ Erreur vérification données: {str(e)}")
        return False

def check_recent_email_activity():
    """Vérifier l'activité récente des emails"""
    print("\n🔍 Vérification de l'activité récente des emails...")
    
    try:
        # Paires avec emails envoyés récemment (dernières 24h)
        from django.utils import timezone
        from datetime import timedelta
        
        yesterday = timezone.now() - timedelta(days=1)
        recent_sent = EmployeePair.objects.filter(
            email_sent_at__gte=yesterday
        ).count()
        
        print(f"✅ Emails envoyés dans les dernières 24h: {recent_sent}")
        
        if recent_sent > 0:
            # Détails des emails récents
            recent_pairs = EmployeePair.objects.filter(
                email_sent_at__gte=yesterday
            ).select_related('employee1', 'employee2', 'campaign')[:5]
            
            print("📧 Détails des emails récents:")
            for pair in recent_pairs:
                print(f"   - Paire {pair.id}: {pair.employee1.name} & {pair.employee2.name}")
                print(f"     Campagne: {pair.campaign.title}")
                print(f"     Envoyé: {pair.email_sent_at}")
                print(f"     email_sent: {pair.email_sent}, email_status: {pair.email_status}")
        
        return True
    except Exception as e:
        print(f"❌ Erreur vérification activité: {str(e)}")
        return False

def check_file_permissions():
    """Vérifier les permissions des fichiers"""
    print("\n🔍 Vérification des permissions des fichiers...")
    
    try:
        # Vérifier les fichiers de configuration
        config_files = [
            'coffee_meetings_platform/settings.py',
            '.env',
            'manage.py'
        ]
        
        for file_path in config_files:
            if os.path.exists(file_path):
                try:
                    with open(file_path, 'r') as f:
                        f.read(100)  # Lire les premiers 100 caractères
                    print(f"✅ {file_path}: Lisible")
                except Exception as e:
                    print(f"❌ {file_path}: Non lisible - {str(e)}")
            else:
                print(f"⚠️ {file_path}: N'existe pas")
        
        return True
    except Exception as e:
        print(f"❌ Erreur vérification permissions: {str(e)}")
        return False

def main():
    """Fonction principale"""
    print("🚀 Vérification de la configuration de production")
    print("=" * 60)
    
    # Tests
    db_ok = check_database_connection()
    email_ok = check_email_configuration()
    env_ok = check_environment_variables()
    data_ok = check_database_data()
    activity_ok = check_recent_email_activity()
    files_ok = check_file_permissions()
    
    # Résumé
    print("\n" + "=" * 60)
    print("📊 RÉSUMÉ DE LA VÉRIFICATION")
    print("=" * 60)
    print(f"🗄️ Base de données: {'✅ OK' if db_ok else '❌ ÉCHEC'}")
    print(f"📧 Configuration email: {'✅ OK' if email_ok else '❌ ÉCHEC'}")
    print(f"🔧 Variables d'environnement: {'✅ OK' if env_ok else '❌ ÉCHEC'}")
    print(f"📊 Données: {'✅ OK' if data_ok else '❌ ÉCHEC'}")
    print(f"📈 Activité récente: {'✅ OK' if activity_ok else '❌ ÉCHEC'}")
    print(f"📁 Permissions fichiers: {'✅ OK' if files_ok else '❌ ÉCHEC'}")
    
    if all([db_ok, email_ok, env_ok, data_ok, activity_ok, files_ok]):
        print("\n🎉 Toute la configuration semble correcte!")
        print("💡 Le problème pourrait être:")
        print("   - Dans le code frontend (synchronisation)")
        print("   - Dans la logique métier (workflow)")
        print("   - Dans les permissions utilisateur")
        print("   - Dans la configuration du serveur web")
    else:
        print("\n⚠️ Des problèmes de configuration ont été détectés.")
        print("🔧 Corrigez ces problèmes avant de tester à nouveau.")

if __name__ == '__main__':
    main()
