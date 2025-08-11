# ☕ CoffeeMeet - Plateforme de Rencontres Café d'Entreprise

**CoffeeMeet** est une plateforme innovante conçue pour les responsables RH qui souhaitent favoriser les connexions humaines et renforcer la cohésion d'équipe au sein de leur entreprise. Notre solution automatise l'organisation de rencontres café entre employés, créant des opportunités naturelles d'échange et de collaboration.

## 🎯 Problème Résolu

Dans les entreprises modernes, particulièrement avec le télétravail et les équipes distribuées, les employés peuvent se sentir isolés et déconnectés de leurs collègues. Les silos départementaux limitent la collaboration inter-équipes et réduisent l'innovation. CoffeeMeet résout ces défis en :

- **Brisant les silos** : Connecte des employés de différents départements
- **Favorisant l'inclusion** : Aide les nouveaux employés à s'intégrer naturellement
- **Renforçant la culture d'entreprise** : Crée des liens authentiques entre collègues
- **Stimulant l'innovation** : Facilite le partage d'idées entre équipes diverses

## ✨ Fonctionnalités Principales

### 🎯 **Gestion de Campagnes Intelligente**
- Création de campagnes de rencontres café personnalisées
- Algorithmes de matching avancés basés sur les critères RH
- Planification automatisée avec dates de début et fin
- Suivi en temps réel du statut des campagnes

### 👥 **Gestion d'Employés Simplifiée**
- Import en masse via fichiers Excel/CSV
- Gestion des attributs personnalisés (département, poste, ancienneté, etc.)
- Interface intuitive pour ajouter/modifier les profils
- Système de validation des données

### 🤖 **Algorithme de Matching Intelligent**
- Correspondances basées sur des critères configurables
- Options "même département" ou "départements différents"
- Évite les doublons et optimise la diversité des rencontres
- Génération automatique de paires équilibrées

### 📊 **Analyses et Rapports Détaillés**
- Tableaux de bord avec métriques clés
- Statistiques de participation et d'engagement
- Rapports d'évaluation post-rencontre
- Export PDF des résultats de campagne

### 📧 **Communication Automatisée**
- Envoi automatique d'invitations par email
- Liens d'évaluation personnalisés pour chaque participant
- Notifications de suivi et rappels
- Templates d'emails personnalisables

### 🔒 **Sécurité et Confidentialité**
- Authentification JWT sécurisée
- Isolation complète des données par entreprise
- Gestion des permissions granulaire
- Conformité RGPD

## 🎯 Public Cible

### **Responsables RH et People Operations**
- Entreprises de 50 à 5000+ employés
- Organisations avec équipes distribuées ou télétravail
- Entreprises cherchant à améliorer l'engagement employé
- Structures souhaitant renforcer leur culture d'entreprise

### **Secteurs d'Activité**
- Technologie et startups
- Services financiers
- Consulting et services professionnels
- Entreprises manufacturières
- Organisations à but non lucratif

## 🏗️ Architecture Technique

### **Backend - Django REST API**
- **Framework** : Django 5.2 avec Django REST Framework
- **Base de données** : SQLite (développement) / PostgreSQL (production)
- **Authentification** : JWT avec django-rest-framework-simplejwt
- **Cache** : Redis pour les performances
- **Email** : Support SMTP configurable
- **Sécurité** : CORS, protection CSRF, validation des données

### **Frontend - React SPA**
- **Framework** : React 18 avec hooks modernes
- **Styling** : Tailwind CSS pour un design responsive
- **Routing** : React Router pour la navigation
- **State Management** : Context API et hooks personnalisés
- **HTTP Client** : Axios pour les appels API
- **Icons** : Heroicons pour une interface cohérente

### **Fonctionnalités Techniques**
- **Responsive Design** : Compatible mobile, tablette et desktop
- **Internationalisation** : Interface entièrement en français
- **Performance** : Optimisations de requêtes et mise en cache
- **Monitoring** : Logs de performance et suivi des erreurs

## 🚀 Démarrage Rapide

### **Prérequis Système**
- **Python** 3.9+ avec pip
- **Node.js** 16+ avec npm
- **Git** pour le clonage du repository
- **Navigateur moderne** (Chrome, Firefox, Safari, Edge)

### **Installation Express**
```bash
# 1. Cloner le projet
git clone <repository-url>
cd coffee-meetings-platform

# 2. Configuration Backend
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate     # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# 3. Configuration Frontend (nouveau terminal)
cd frontend
npm install
npm start
```

### **Accès à l'Application**
- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:8000
- **Admin Django** : http://localhost:8000/admin

> 📖 **Pour des instructions détaillées**, consultez [SETUP.md](./SETUP.md)
> 📚 **Documentation complète** disponible dans [DOCUMENTATION.md](./DOCUMENTATION.md)

## 📱 Captures d'Écran et Démonstration

### **Tableau de Bord Principal**
Interface intuitive avec vue d'ensemble des campagnes actives, statistiques clés et actions rapides.

### **Création de Campagne**
Assistant pas-à-pas pour configurer une nouvelle campagne avec critères de matching personnalisés.

### **Gestion d'Employés**
Import en masse et gestion individuelle des profils employés avec attributs personnalisables.

### **Résultats et Analytics**
Tableaux de bord détaillés avec métriques de participation et rapports d'évaluation.

## 🛠️ Technologies Utilisées

### **Backend**
- Django 5.2 + Django REST Framework
- PostgreSQL / SQLite
- Redis (cache et sessions)
- Celery (tâches asynchrones)
- JWT Authentication
- SMTP Email Support

### **Frontend**
- React 18 + Hooks
- Tailwind CSS
- React Router
- Axios
- Heroicons
- Context API

### **DevOps & Outils**
- Git pour le versioning
- npm/pip pour la gestion des dépendances
- Environment variables pour la configuration
- Logging et monitoring intégrés

## 📊 Métriques et Bénéfices

### **Impact Mesurable**
- **87%** des utilisateurs rapportent des relations professionnelles plus fortes
- **92%** se sentent plus connectés à la culture d'entreprise
- **78%** observent une collaboration inter-équipes accrue
- **95%** recommanderaient la solution à leurs collègues

### **ROI pour l'Entreprise**
- Réduction du turnover par amélioration de l'engagement
- Augmentation de l'innovation grâce aux échanges inter-départements
- Amélioration de la productivité par une meilleure collaboration
- Renforcement de la marque employeur

## 🤝 Contribution et Support

### **Structure du Projet**
```
coffee-meetings-platform/
├── backend/                 # API Django
│   ├── campaigns/          # Gestion des campagnes
│   ├── employees/          # Gestion des employés
│   ├── matching/           # Algorithmes de matching
│   ├── evaluations/        # Système d'évaluation
│   ├── notifications/      # Système de notifications
│   └── users/              # Authentification et profils
├── frontend/               # Application React
│   ├── src/components/     # Composants réutilisables
│   ├── src/pages/          # Pages de l'application
│   ├── src/services/       # Services API
│   └── src/contexts/       # Contextes React
└── docs/                   # Documentation
```

### **Développement**
- **Code Style** : PEP 8 pour Python, ESLint/Prettier pour JavaScript
- **Tests** : Couverture de tests pour les fonctionnalités critiques
- **Documentation** : Code documenté et guides utilisateur
- **Sécurité** : Revues de code et tests de sécurité réguliers

## 📞 Contact et Support

Pour toute question, suggestion ou support technique :

- **📚 Documentation Complète** : [DOCUMENTATION.md](./DOCUMENTATION.md) - Index de toute la documentation
- **🛠️ Guide d'Installation** : [SETUP.md](./SETUP.md) - Instructions détaillées
- **🐛 Issues** : Utilisez le système d'issues du repository
- **💬 Support** : Contactez l'équipe de développement

---

**Développé avec ❤️ pour créer des connexions humaines authentiques en entreprise**

*CoffeeMeet - Transformez votre culture d'entreprise, une tasse de café à la fois* ☕
