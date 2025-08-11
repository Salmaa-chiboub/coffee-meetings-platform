# Guide de Configuration Email - Coffee Meetings Platform

## 🚨 Problème Actuel
L'étape de confirmation affiche que l'action a réussi, mais les emails ne sont pas reçus.

## 🔍 Diagnostic
1. **Configuration actuelle** : `EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'`
2. **Résultat** : Les emails s'affichent dans la console Django (pas d'envoi réel)
3. **Cause** : Pas de configuration SMTP valide

## ✅ Solutions

### Option 1 : Voir les emails dans la console (Développement)
Avec la configuration actuelle, les emails s'affichent dans la console Django.
**Avantage** : Rapide pour les tests
**Inconvénient** : Pas d'envoi réel

### Option 2 : Configuration Gmail (Recommandée pour tests)
1. **Créer un fichier `.env` dans le dossier `backend/`** :
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=votre-email@gmail.com
EMAIL_HOST_PASSWORD=votre-mot-de-passe-application
DEFAULT_FROM_EMAIL=votre-email@gmail.com
FRONTEND_URL=http://localhost:3000
```

2. **Modifier `settings.py`** :
```python
# Commenter la ligne console
# EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Décommenter la ligne SMTP
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
```

3. **Créer un mot de passe d'application Gmail** :
   - Aller dans votre compte Google
   - Sécurité → Validation en deux étapes → Mots de passe des applications
   - Générer un mot de passe pour "Coffee Meetings Platform"

### Option 3 : Configuration Outlook/Hotmail
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=votre-email@outlook.com
EMAIL_HOST_PASSWORD=votre-mot-de-passe
DEFAULT_FROM_EMAIL=votre-email@outlook.com
```

### Option 4 : Mailtrap (Service de test)
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

## 🧪 Test de Configuration

### Test 1 : Vérifier la configuration actuelle
```bash
cd backend
python test_email.py
```

### Test 2 : Vérifier les logs Django
Après avoir confirmé des paires, regarder la console Django pour voir :
- Les tentatives d'envoi d'emails
- Les erreurs éventuelles
- Les emails affichés (si backend console)

### Test 3 : Vérifier la base de données
```sql
-- Vérifier le statut des emails
SELECT id, email_status, email_sent_at, email_error_message 
FROM matching_employeepair 
WHERE campaign_id = VOTRE_CAMPAIGN_ID;
```

## 🔧 Dépannage

### Erreur "Authentication failed"
- Vérifier les identifiants
- S'assurer que la validation en deux étapes est activée (Gmail)
- Utiliser un mot de passe d'application

### Erreur "Connection refused"
- Vérifier l'HOST et le PORT
- Vérifier la connexion internet
- Tester avec telnet : `telnet smtp.gmail.com 587`

### Emails non reçus
- Vérifier les dossiers spam
- Vérifier l'adresse email destinataire
- Tester avec Mailtrap d'abord

## 📝 Logs et Monitoring

Le système enregistre maintenant des logs détaillés :
- 🚀 Début des notifications
- 📧 Tentatives d'envoi
- ✅ Succès
- ❌ Échecs avec détails

## 🚀 Prochaines Étapes

1. **Choisir une option de configuration** (Gmail recommandé)
2. **Créer le fichier `.env`** avec les bonnes valeurs
3. **Modifier `settings.py`** pour utiliser SMTP
4. **Tester l'envoi** avec le script de test
5. **Confirmer des paires** pour vérifier l'envoi réel

## 📞 Support

Si le problème persiste :
1. Vérifier les logs Django
2. Tester avec Mailtrap
3. Vérifier la configuration SMTP
4. Contrôler les permissions et pare-feu
