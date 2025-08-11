#!/usr/bin/env python3
"""
Script de debug pour simuler exactement le flux de la plateforme réelle
et identifier pourquoi les emails ne sont pas envoyés et email_sent reste false
"""

import os
import sys
import django
from datetime import datetime

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'coffee_meetings_platform.settings')
django.setup()

from django.contrib.auth.models import User
from django.core.mail import get_connection
from django.conf import settings
from matching.models import EmployeePair, CampaignMatchingCriteria
from matching.services import EmailNotificationService
from campaigns.models import Campaign
from employees.models import Employee
from matching.views import ConfirmPairsView
from rest_framework.test import APIRequestFactory
from rest_framework.test import force_authenticate

def test_email_backend_connection():
    """Test de la connexion au backend email"""
    print("🔍 Test de la connexion au backend email...")
    
    try:
        connection = get_connection()
        print(f"✅ Backend email: {settings.EMAIL_BACKEND}")
        print(f"✅ Host: {getattr(settings, 'EMAIL_HOST', 'Non défini')}")
        print(f"✅ Port: {getattr(settings, 'EMAIL_PORT', 'Non défini')}")
        print(f"✅ From email: {getattr(settings, 'DEFAULT_FROM_EMAIL', 'Non défini')}")
        
        # Test de connexion
        connection.open()
        print("✅ Connexion email réussie!")
        connection.close()
        return True
    except Exception as e:
        print(f"❌ Erreur de connexion email: {str(e)}")
        return False

def test_email_sending_directly():
    """Test d'envoi d'email direct avec Django"""
    print("\n🔍 Test d'envoi d'email direct avec Django...")
    
    try:
        from django.core.mail import send_mail
        
        # Email de test
        result = send_mail(
            subject='Test Email - Coffee Meetings Platform',
            message='Ceci est un email de test pour vérifier la configuration.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=['test@example.com'],
            fail_silently=False,
        )
        
        print(f"✅ Email envoyé avec succès! Résultat: {result}")
        return True
    except Exception as e:
        print(f"❌ Erreur d'envoi d'email: {str(e)}")
        import traceback
        print(f"Traceback complet: {traceback.format_exc()}")
        return False

def test_email_notification_service():
    """Test du service EmailNotificationService"""
    print("\n🔍 Test du service EmailNotificationService...")
    
    try:
        # Créer un service
        email_service = EmailNotificationService()
        print(f"✅ Service créé avec succès")
        print(f"✅ From email: {email_service.from_email}")
        
        # Vérifier la configuration
        print(f"✅ Backend configuré: {settings.EMAIL_BACKEND}")
        
        return True
    except Exception as e:
        print(f"❌ Erreur du service email: {str(e)}")
        import traceback
        print(f"Traceback complet: {traceback.format_exc()}")
        return False

def test_confirm_pairs_view_simulation():
    """Simulation de la vue ConfirmPairsView avec des données existantes"""
    print("\n🔍 Simulation de la vue ConfirmPairsView...")
    
    try:
        # Utiliser des données existantes au lieu d'en créer de nouvelles
        campaign = Campaign.objects.first()
        if not campaign:
            print("❌ Aucune campagne trouvée dans la base de données")
            return False
            
        print(f"✅ Campagne trouvée: {campaign.id} - {campaign.title}")
        print(f"✅ HR Manager: {campaign.hr_manager}")
        
        # Trouver des employés existants
        employees = Employee.objects.filter(campaign=campaign)[:2]
        if len(employees) < 2:
            print("❌ Pas assez d'employés dans cette campagne")
            return False
            
        emp1, emp2 = employees[0], employees[1]
        print(f"✅ Employé 1: {emp1.id} - {emp1.name} ({emp1.email})")
        print(f"✅ Employé 2: {emp2.id} - {emp2.name} ({emp2.email})")
        
        # Vérifier si une paire existe déjà
        existing_pair = EmployeePair.objects.filter(
            campaign=campaign,
            employee1=emp1,
            employee2=emp2
        ).first()
        
        if not existing_pair:
            # Créer une nouvelle paire
            pair = EmployeePair.objects.create(
                campaign=campaign,
                employee1=emp1,
                employee2=emp2,
                created_by='debug_script'
            )
            print(f"✅ Nouvelle paire créée: {pair.id}")
        else:
            pair = existing_pair
            print(f"✅ Paire existante trouvée: {pair.id}")
        
        print(f"✅ État initial email_sent: {pair.email_sent}")
        print(f"✅ État initial email_status: {pair.email_status}")
        
        # Simuler l'envoi d'email
        email_service = EmailNotificationService()
        result = email_service.send_pair_notifications([pair])
        
        print(f"✅ Résultat envoi email: {result}")
        
        # Recharger la paire pour voir les changements
        pair.refresh_from_db()
        print(f"✅ État final email_sent: {pair.email_sent}")
        print(f"✅ État final email_status: {pair.email_status}")
        print(f"✅ email_sent_at: {pair.email_sent_at}")
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur simulation ConfirmPairsView: {str(e)}")
        import traceback
        print(f"Traceback complet: {traceback.format_exc()}")
        return False

def test_serializer_exposure():
    """Test de l'exposition du champ email_sent par le serializer"""
    print("\n🔍 Test de l'exposition du champ email_sent par le serializer...")
    
    try:
        from matching.serializers import EmployeePairSerializer
        
        # Créer une paire de test
        campaign = Campaign.objects.first()
        if not campaign:
            print("❌ Aucune campagne trouvée pour le test")
            return False
            
        pair = EmployeePair.objects.filter(campaign=campaign).first()
        if not pair:
            print("❌ Aucune paire trouvée pour le test")
            return False
        
        # Sérialiser la paire
        serializer = EmployeePairSerializer(pair)
        data = serializer.data
        
        print(f"✅ Champs exposés par le serializer: {list(data.keys())}")
        
        if 'email_sent' in data:
            print(f"✅ email_sent est exposé: {data['email_sent']}")
        else:
            print(f"❌ email_sent n'est PAS exposé par le serializer!")
            
        if 'email_status' in data:
            print(f"✅ email_status est exposé: {data['email_status']}")
        else:
            print(f"❌ email_status n'est PAS exposé par le serializer!")
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur test serializer: {str(e)}")
        import traceback
        print(f"Traceback complet: {traceback.format_exc()}")
        return False

def test_existing_pairs_email_status():
    """Test du statut email des paires existantes"""
    print("\n🔍 Test du statut email des paires existantes...")
    
    try:
        # Trouver toutes les paires
        all_pairs = EmployeePair.objects.all()
        print(f"✅ Total des paires trouvées: {all_pairs.count()}")
        
        if all_pairs.count() == 0:
            print("❌ Aucune paire trouvée dans la base de données")
            return False
        
        # Analyser le statut des emails
        email_status_counts = {}
        email_sent_counts = {'True': 0, 'False': 0}
        
        for pair in all_pairs:
            # Compter par email_status
            status = pair.email_status
            email_status_counts[status] = email_status_counts.get(status, 0) + 1
            
            # Compter par email_sent
            sent = str(pair.email_sent)
            email_sent_counts[sent] = email_sent_counts.get(sent, 0) + 1
        
        print(f"✅ Répartition par email_status: {email_status_counts}")
        print(f"✅ Répartition par email_sent: {email_sent_counts}")
        
        # Vérifier la cohérence
        inconsistent_pairs = []
        for pair in all_pairs:
            if pair.email_status == 'sent' and not pair.email_sent:
                inconsistent_pairs.append(f"Paire {pair.id}: status='sent' mais email_sent=False")
            elif pair.email_status == 'pending' and pair.email_sent:
                inconsistent_pairs.append(f"Paire {pair.id}: status='pending' mais email_sent=True")
        
        if inconsistent_pairs:
            print(f"⚠️ Paires incohérentes trouvées:")
            for msg in inconsistent_pairs:
                print(f"   - {msg}")
        else:
            print("✅ Toutes les paires sont cohérentes")
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur test statut existant: {str(e)}")
        import traceback
        print(f"Traceback complet: {traceback.format_exc()}")
        return False

def main():
    """Fonction principale de test"""
    print("🚀 Début du debug complet de la plateforme réelle")
    print("=" * 60)
    
    # Test 1: Connexion email
    email_connection_ok = test_email_backend_connection()
    
    # Test 2: Envoi direct d'email
    if email_connection_ok:
        email_sending_ok = test_email_sending_directly()
    else:
        email_sending_ok = False
    
    # Test 3: Service de notification
    service_ok = test_email_notification_service()
    
    # Test 4: Simulation de la vue
    view_simulation_ok = test_confirm_pairs_view_simulation()
    
    # Test 5: Serializer
    serializer_ok = test_serializer_exposure()
    
    # Test 6: Statut des paires existantes
    existing_status_ok = test_existing_pairs_email_status()
    
    # Résumé
    print("\n" + "=" * 60)
    print("📊 RÉSUMÉ DES TESTS")
    print("=" * 60)
    print(f"🔌 Connexion email: {'✅ OK' if email_connection_ok else '❌ ÉCHEC'}")
    print(f"📧 Envoi email direct: {'✅ OK' if email_sending_ok else '❌ ÉCHEC'}")
    print(f"🔧 Service notification: {'✅ OK' if service_ok else '❌ ÉCHEC'}")
    print(f"🌐 Simulation vue: {'✅ OK' if view_simulation_ok else '❌ ÉCHEC'}")
    print(f"📝 Serializer: {'✅ OK' if serializer_ok else '❌ ÉCHEC'}")
    print(f"📊 Statut existant: {'✅ OK' if existing_status_ok else '❌ ÉCHEC'}")
    
    if all([email_connection_ok, email_sending_ok, service_ok, view_simulation_ok, serializer_ok, existing_status_ok]):
        print("\n🎉 Tous les tests sont passés! Le problème doit être ailleurs...")
        print("💡 Suggestions:")
        print("   - Vérifier les logs de la plateforme réelle")
        print("   - Vérifier les variables d'environnement")
        print("   - Vérifier les permissions de base de données")
    else:
        print("\n⚠️ Certains tests ont échoué. Vérifiez les erreurs ci-dessus.")

if __name__ == '__main__':
    main()
