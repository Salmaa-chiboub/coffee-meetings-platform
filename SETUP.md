# 🛠️ Guide d'Installation et Configuration - CoffeeMeet

Ce guide vous accompagne pas-à-pas dans l'installation et la configuration de la plateforme CoffeeMeet sur votre environnement de développement.

## 📋 Prérequis Système

### **Logiciels Requis**
- **Python** 3.9 ou supérieur ([Télécharger Python](https://www.python.org/downloads/))
- **Node.js** 16 ou supérieur ([Télécharger Node.js](https://nodejs.org/))
- **Git** pour le clonage du repository ([Télécharger Git](https://git-scm.com/))
- **Navigateur moderne** (Chrome, Firefox, Safari, Edge)

### **Vérification des Versions**
```bash
# Vérifier Python
python --version  # ou python3 --version
# Sortie attendue : Python 3.9.x ou supérieur

# Vérifier Node.js
node --version
# Sortie attendue : v16.x.x ou supérieur

# Vérifier npm
npm --version
# Sortie attendue : 8.x.x ou supérieur

# Vérifier Git
git --version
# Sortie attendue : git version 2.x.x
```

## 📁 Clonage et Structure du Projet

### **1. Cloner le Repository**
```bash
# Cloner le projet
git clone <repository-url>
cd coffee-meetings-platform

# Vérifier la structure
ls -la
# Vous devriez voir : backend/ frontend/ README.md SETUP.md
```

### **2. Structure du Projet**
```
coffee-meetings-platform/
├── backend/                 # API Django REST
│   ├── manage.py           # Script de gestion Django
│   ├── requirements.txt    # Dépendances Python
│   ├── coffee_meetings_platform/  # Configuration principale
│   ├── users/              # Authentification et profils
│   ├── campaigns/          # Gestion des campagnes
│   ├── employees/          # Gestion des employés
│   ├── matching/           # Algorithmes de matching
│   ├── evaluations/        # Système d'évaluation
│   └── notifications/      # Système de notifications
├── frontend/               # Application React
│   ├── package.json        # Dépendances Node.js
│   ├── src/                # Code source React
│   ├── public/             # Fichiers statiques
│   └── build/              # Build de production (généré)
├── README.md               # Documentation principale
└── SETUP.md               # Ce guide d'installation
```

## 🐍 Configuration du Backend (Django)

### **1. Création de l'Environnement Virtuel**

#### **Linux/macOS :**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
```

#### **Windows (PowerShell) :**
```powershell
cd backend
python -m venv venv
venv\Scripts\Activate.ps1
```

#### **Windows (Command Prompt) :**
```cmd
cd backend
python -m venv venv
venv\Scripts\activate.bat
```

### **2. Installation des Dépendances**
```bash
# S'assurer que l'environnement virtuel est activé
# Vous devriez voir (venv) au début de votre prompt

# Mettre à jour pip
pip install --upgrade pip

# Installer les dépendances
pip install -r requirements.txt
```

### **3. Configuration de la Base de Données**
```bash
# Créer et appliquer les migrations
python manage.py makemigrations
python manage.py migrate

# Créer un superutilisateur (optionnel)
python manage.py createsuperuser
# Suivre les instructions pour créer un compte admin
```

### **4. Variables d'Environnement Backend**

Créez un fichier `.env` dans le dossier `backend/` en copiant le template :

```bash
# Copier le fichier d'exemple
cp backend/.env.example backend/.env

# Ou créer manuellement le fichier .env
```

```bash
# backend/.env
SECRET_KEY=your-secret-key-here-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Base de données (SQLite par défaut)
DATABASE_URL=sqlite:///db.sqlite3

# Email Configuration (optionnel pour le développement)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000

# Cache (optionnel)
REDIS_URL=redis://localhost:6379/0
```

### **5. Démarrage du Serveur Backend**
```bash
# Dans le dossier backend/ avec l'environnement virtuel activé
python manage.py runserver

# Le serveur démarre sur http://localhost:8000
# Vous devriez voir :
# Starting development server at http://127.0.0.1:8000/
```

## ⚛️ Configuration du Frontend (React)

### **1. Installation des Dépendances**
```bash
# Ouvrir un nouveau terminal
cd frontend

# Installer les dépendances Node.js
npm install

# Ou avec yarn si vous préférez
yarn install
```

### **2. Variables d'Environnement Frontend**

Créez un fichier `.env` dans le dossier `frontend/` en copiant le template :

```bash
# Copier le fichier d'exemple
cp frontend/.env.example frontend/.env

# Ou créer manuellement le fichier .env
```

```bash
# frontend/.env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_BACKEND_URL=http://localhost:8000
REACT_APP_FRONTEND_URL=http://localhost:3000

# Optionnel : Configuration pour le développement
GENERATE_SOURCEMAP=true
REACT_APP_ENV=development
```

### **3. Démarrage du Serveur Frontend**
```bash
# Dans le dossier frontend/
npm start

# Ou avec yarn
yarn start

# Le serveur démarre sur http://localhost:3000
# Votre navigateur devrait s'ouvrir automatiquement
```

## 🚀 Vérification de l'Installation

### **1. Tests de Connectivité**

#### **Backend API :**
- Ouvrez http://localhost:8000 dans votre navigateur
- Vous devriez voir une page d'API ou un message de Django

#### **Frontend Application :**
- Ouvrez http://localhost:3000 dans votre navigateur
- Vous devriez voir la page d'accueil de CoffeeMeet

#### **Admin Django (optionnel) :**
- Ouvrez http://localhost:8000/admin
- Connectez-vous avec le superutilisateur créé précédemment

### **2. Test de Communication Frontend-Backend**
1. Sur la page d'accueil (localhost:3000)
2. Cliquez sur "Se connecter" ou "Créer un compte"
3. Si la page se charge sans erreur, la communication fonctionne

## 🔧 Configuration Avancée

### **Base de Données PostgreSQL (Production)**

Si vous souhaitez utiliser PostgreSQL au lieu de SQLite :

```bash
# Installer psycopg2
pip install psycopg2-binary

# Modifier backend/.env
DATABASE_URL=postgresql://username:password@localhost:5432/coffeemeet_db
```

### **Redis pour le Cache (Optionnel)**

```bash
# Installer Redis
# Ubuntu/Debian: sudo apt install redis-server
# macOS: brew install redis
# Windows: Télécharger depuis https://redis.io/download

# Démarrer Redis
redis-server

# Modifier backend/.env
REDIS_URL=redis://localhost:6379/0
```

### **Configuration Email SMTP**

Pour l'envoi d'emails en production, configurez dans `backend/.env` :

```bash
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

## 🐛 Dépannage

### **Problèmes Courants Backend**

#### **Erreur : "No module named 'django'"**
```bash
# Solution : Activer l'environnement virtuel
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
```

#### **Erreur de Migration**
```bash
# Solution : Réinitialiser les migrations
python manage.py migrate --fake-initial
python manage.py migrate
```

#### **Port 8000 déjà utilisé**
```bash
# Solution : Utiliser un autre port
python manage.py runserver 8001
# Puis modifier REACT_APP_API_URL dans frontend/.env
```

### **Problèmes Courants Frontend**

#### **Erreur : "npm command not found"**
- Réinstaller Node.js depuis https://nodejs.org/

#### **Erreur de dépendances npm**
```bash
# Solution : Nettoyer et réinstaller
rm -rf node_modules package-lock.json
npm install
```

#### **Erreur CORS**
- Vérifier que le backend est démarré sur localhost:8000
- Vérifier les variables d'environnement dans frontend/.env

### **Problèmes de Performance**

#### **Backend lent**
```bash
# Vérifier les logs
python manage.py runserver --verbosity=2
```

#### **Frontend lent**
```bash
# Mode développement optimisé
npm start --optimize
```

## 📚 Commandes Utiles

### **Backend Django**
```bash
# Créer une nouvelle migration
python manage.py makemigrations

# Appliquer les migrations
python manage.py migrate

# Créer un superutilisateur
python manage.py createsuperuser

# Collecter les fichiers statiques
python manage.py collectstatic

# Shell Django interactif
python manage.py shell

# Tests
python manage.py test
```

### **Frontend React**
```bash
# Démarrer en mode développement
npm start

# Créer un build de production
npm run build

# Lancer les tests
npm test

# Analyser le bundle
npm run analyze

# Linter le code
npm run lint

# Formater le code
npm run format
```

## 🎯 Prochaines Étapes

Une fois l'installation terminée :

1. **Créer votre premier compte HR** sur http://localhost:3000
2. **Explorer l'interface** et les fonctionnalités
3. **Créer une campagne de test** avec quelques employés fictifs
4. **Consulter la documentation** pour les fonctionnalités avancées

## 📞 Support

Si vous rencontrez des problèmes non couverts par ce guide :

1. Vérifiez les logs dans les terminaux backend et frontend
2. Consultez la documentation Django et React
3. Vérifiez les issues du repository
4. Contactez l'équipe de développement

---

**Installation réussie ? Vous êtes prêt à transformer votre culture d'entreprise ! ☕**
