# Configuration Email pour Tests

## Options de Configuration

### Option 1 : Gmail (Recommandée pour tests)

1. **Créer un mot de passe d'application Gmail :**
   - Aller dans votre compte Google
   - Sécurité → Validation en deux étapes → Mots de passe des applications
   - Générer un mot de passe pour "Coffee Meetings Platform"

2. **Configurer le fichier .env :**
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=votre-email@gmail.com
EMAIL_HOST_PASSWORD=votre-mot-de-passe-application
DEFAULT_FROM_EMAIL=votre-email@gmail.com
```

### Option 2 : Outlook/Hotmail

```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=votre-email@outlook.com
EMAIL_HOST_PASSWORD=votre-mot-de-passe
DEFAULT_FROM_EMAIL=votre-email@outlook.com
```

### Option 3 : Mailtrap (Service de test)

1. Créer un compte sur https://mailtrap.io
2. Configurer :

```env
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USE_TLS=True
EMAIL_HOST_USER=votre-username-mailtrap
EMAIL_HOST_PASSWORD=votre-password-mailtrap
DEFAULT_FROM_EMAIL=test@coffeemeetings.com
```

### Option 4 : Console Backend (Développement uniquement)

Pour voir les emails dans la console sans les envoyer :

Dans `settings.py`, changer :
```python
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
```

## Test de Configuration

Créer un script de test :

```python
# test_email.py
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'coffee_meetings_platform.settings')
django.setup()

from django.core.mail import send_mail
from django.conf import settings

try:
    send_mail(
        'Test Email',
        'Ceci est un test d\'envoi d\'email.',
        settings.DEFAULT_FROM_EMAIL,
        ['destinataire@example.com'],
        fail_silently=False,
    )
    print("✅ Email envoyé avec succès!")
except Exception as e:
    print(f"❌ Erreur: {e}")
```

## Sécurité

⚠️ **Important :**
- Ne jamais commiter les mots de passe dans le code
- Utiliser des mots de passe d'application pour Gmail
- Activer la validation en deux étapes
- Utiliser des variables d'environnement

## Dépannage

### Erreur "Authentication failed"
- Vérifier les identifiants
- S'assurer que la validation en deux étapes est activée
- Utiliser un mot de passe d'application

### Erreur "Connection refused"
- Vérifier l'HOST et le PORT
- Vérifier la connexion internet
- Tester avec telnet : `telnet smtp.gmail.com 587`

### Emails non reçus
- Vérifier les dossiers spam
- Vérifier l'adresse email destinataire
- Tester avec Mailtrap d'abord
