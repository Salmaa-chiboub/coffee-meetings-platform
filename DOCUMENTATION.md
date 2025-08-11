# 📚 Documentation CoffeeMeet - Index Complet

Ce document centralise toute la documentation disponible pour la plateforme CoffeeMeet.

## 📖 Documentation Principale

### **🏠 [README.md](./README.md)**
- Vue d'ensemble du projet CoffeeMeet
- Fonctionnalités principales et bénéfices
- Architecture technique (Django + React)
- Public cible et cas d'usage
- Métriques et impact business

### **🛠️ [SETUP.md](./SETUP.md)**
- Guide d'installation complet étape par étape
- Configuration de l'environnement de développement
- Prérequis système et vérifications
- Variables d'environnement
- Dépannage et résolution de problèmes

## 📁 Documentation Technique

### **Backend (Django)**

#### **🔧 [backend/CACHE_SETUP.md](./backend/CACHE_SETUP.md)**
- Installation et configuration de Redis
- Optimisation des performances avec le cache
- Configuration pour développement et production

#### **📧 [backend/EMAIL_CONFIGURATION.md](./backend/EMAIL_CONFIGURATION.md)**
- Configuration SMTP pour l'envoi d'emails
- Setup Gmail et autres fournisseurs
- Templates d'emails et personnalisation
- Tests et dépannage email

#### **🔐 [USER_ISOLATION_GUIDE.md](./USER_ISOLATION_GUIDE.md)**
- Architecture de séparation des données utilisateurs
- Sécurité et isolation des données par HR Manager
- Modèles de données et relations
- Permissions et contrôles d'accès

### **Frontend (React)**

#### **⚛️ [frontend/README.md](./frontend/README.md)**
- Documentation spécifique au frontend React
- Structure du projet et composants
- Scripts de développement et build
- Technologies utilisées (Tailwind, React Router, etc.)

## 🔧 Fichiers de Configuration

### **Variables d'Environnement**
- **[backend/.env.example](./backend/.env.example)** - Template de configuration backend
- **[frontend/.env.example](./frontend/.env.example)** - Template de configuration frontend

### **Fichiers de Projet**
- **[.gitignore](./.gitignore)** - Fichiers à exclure du versioning Git
- **[backend/requirements.txt](./backend/requirements.txt)** - Dépendances Python
- **[frontend/package.json](./frontend/package.json)** - Dépendances Node.js

## 🚀 Guides de Démarrage Rapide

### **Pour les Développeurs**
1. Lire [README.md](./README.md) pour comprendre le projet
2. Suivre [SETUP.md](./SETUP.md) pour l'installation
3. Consulter [frontend/README.md](./frontend/README.md) pour le développement frontend
4. Référencer [backend/CACHE_SETUP.md](./backend/CACHE_SETUP.md) pour les performances

### **Pour les Administrateurs Système**
1. [SETUP.md](./SETUP.md) - Installation et déploiement
2. [backend/EMAIL_CONFIGURATION.md](./backend/EMAIL_CONFIGURATION.md) - Configuration email
3. [backend/CACHE_SETUP.md](./backend/CACHE_SETUP.md) - Optimisation performances
4. [USER_ISOLATION_GUIDE.md](./USER_ISOLATION_GUIDE.md) - Sécurité et isolation

### **Pour les Utilisateurs Finaux (HR)**
1. [README.md](./README.md) - Comprendre les fonctionnalités
2. Interface utilisateur intuitive avec aide contextuelle
3. Guides intégrés dans l'application

## 🔍 Documentation par Fonctionnalité

### **Authentification et Sécurité**
- JWT Authentication dans [USER_ISOLATION_GUIDE.md](./USER_ISOLATION_GUIDE.md)
- Variables d'environnement sécurisées dans les fichiers `.env.example`

### **Gestion des Campagnes**
- Architecture dans [README.md](./README.md)
- Code source dans `backend/campaigns/`

### **Algorithmes de Matching**
- Logique métier dans `backend/matching/`
- Documentation technique dans les commentaires du code

### **Système d'Évaluation**
- Modèles dans `backend/evaluations/`
- API publique pour les témoignages

### **Notifications**
- Service de notifications dans `backend/notifications/`
- Configuration email dans [backend/EMAIL_CONFIGURATION.md](./backend/EMAIL_CONFIGURATION.md)

## 🛠️ Outils de Développement

### **Backend Django**
```bash
# Documentation des modèles
python manage.py help

# Shell interactif
python manage.py shell

# Tests
python manage.py test
```

### **Frontend React**
```bash
# Documentation des composants
npm run storybook  # Si configuré

# Tests
npm test

# Analyse du bundle
npm run analyze
```

## 📞 Support et Contribution

### **Où Trouver de l'Aide**
1. **Documentation** : Consultez les fichiers listés ci-dessus
2. **Code** : Commentaires dans le code source
3. **Issues** : Système d'issues du repository Git
4. **Logs** : Vérifiez les logs backend et frontend

### **Contribuer à la Documentation**
1. Suivez le format Markdown existant
2. Ajoutez des exemples concrets
3. Maintenez la cohérence avec le style existant
4. Testez les instructions avant de les documenter

## 🔄 Mise à Jour de la Documentation

Cette documentation doit être mise à jour lors de :
- Ajout de nouvelles fonctionnalités
- Changements dans l'installation ou la configuration
- Modifications de l'architecture
- Résolution de nouveaux problèmes courants

---

**📚 Documentation maintenue avec ❤️ pour faciliter l'utilisation de CoffeeMeet**

*Dernière mise à jour : Août 2025*
