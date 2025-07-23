# Coffee Meetings Platform - Backend

## Structure du projet

```
backend/
├── campaigns/              # Application gestion des campagnes
├── users/                  # Application gestion des utilisateurs HR
├── employees/              # Application gestion des employés
├── evaluations/            # Application gestion des évaluations
├── matching/               # Application algorithme de matching
├── tests/                  # Tests centralisés (séparés des apps)
├── coffee_meetings_platform/  # Configuration Django
└── manage.py
```

## Applications

### Campaigns
- **Modèles** : Campaign
- **Fonctionnalités** : CRUD campagnes, validation dates, sécurité par propriétaire
- **Endpoints** : `/campaigns/`

### Users  
- **Modèles** : HRManager, PasswordResetToken
- **Fonctionnalités** : Authentification JWT, gestion profil, reset password
- **Endpoints** : `/users/`

### Employees
- **Modèles** : Employee, EmployeeAttribute
- **Fonctionnalités** : Gestion employés et leurs attributs
- **Endpoints** : `/employees/`

### Evaluations
- **Modèles** : Evaluation
- **Fonctionnalités** : Évaluations post-meeting
- **Endpoints** : `/evaluations/`

### Matching
- **Modèles** : CampaignMatchingCriteria, EmployeePair
- **Fonctionnalités** : Algorithme de matching, génération de paires
- **Endpoints** : `/matching/`

## Tests

### Structure des tests
```
tests/
├── __init__.py
├── conftest.py             # Configuration et fixtures
├── utils.py                # Utilitaires de test
├── test_campaigns.py       # Tests campaigns
├── test_users.py           # Tests users (à créer)
├── test_employees.py       # Tests employees (à créer)
├── test_evaluations.py     # Tests evaluations (à créer)
└── test_matching.py        # Tests matching (à créer)
```

### Exécution des tests
```bash
# Tous les tests
python manage.py test tests

# Tests spécifiques
python manage.py test tests.test_campaigns

# Avec verbose
python manage.py test tests -v 2

# Garder la DB de test
python manage.py test tests --keepdb
```

### Utilitaires de test
- **TestDataFactory** : Création d'objets de test
- **APITestMixin** : Helpers pour tests API
- **DateTestHelpers** : Helpers pour dates
- **ValidationTestHelpers** : Helpers pour validation

## Installation et configuration

### Prérequis
- Python 3.8+
- PostgreSQL
- pip

### Installation
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Variables d'environnement
Créer un fichier `.env` :
```
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=postgresql://user:password@localhost/dbname
JWT_SECRET_KEY=your-jwt-secret
JWT_ALGORITHM=HS256
JWT_EXP_DELTA_SECONDS=900
```

## API Endpoints

### Authentication
- `POST /users/login/` - Connexion
- `POST /users/register/` - Inscription
- `GET /users/profile/` - Profil utilisateur

### Campaigns
- `GET /campaigns/` - Liste des campagnes
- `POST /campaigns/` - Créer une campagne
- `GET /campaigns/{id}/` - Détail campagne
- `PATCH /campaigns/{id}/` - Modifier campagne
- `DELETE /campaigns/{id}/` - Supprimer campagne

### Employees
- `GET /employees/` - Liste des employés
- `POST /employees/` - Créer un employé

### Matching
- `GET /matching/pairs/` - Paires générées
- `POST /matching/criteria/` - Critères de matching

### Evaluations
- `GET /evaluations/` - Liste des évaluations
- `POST /evaluations/` - Créer une évaluation

## Sécurité

### Authentification
- JWT tokens avec expiration
- Refresh tokens pour renouvellement
- Authentification personnalisée pour HRManager

### Autorisation
- Filtrage automatique par propriétaire
- Permissions personnalisées par app
- Isolation complète des données entre HR managers

### Validation
- Validation des dates (end_date > start_date)
- Protection contre modification des dates après création
- Validation des emails et mots de passe

## Corrections récentes

### Campaigns App
✅ **Corrigé** : Nom du champ ForeignKey (`hr_manager_id` → `hr_manager`)
✅ **Corrigé** : URL principale (`compaigns/` → `campaigns/`)
✅ **Ajouté** : Validation des dates
✅ **Ajouté** : Sécurité et filtrage par propriétaire
✅ **Ajouté** : Permissions personnalisées
✅ **Ajouté** : Gestion d'erreurs améliorée

### Structure de tests
✅ **Réorganisé** : Tests séparés des applications
✅ **Créé** : Utilitaires de test réutilisables
✅ **Ajouté** : Configuration centralisée des tests
✅ **Supprimé** : Anciens fichiers de tests dispersés

## Développement

### Bonnes pratiques
- Tests avant implémentation (TDD)
- Séparation des préoccupations
- Documentation du code
- Validation des données
- Gestion d'erreurs appropriée

### Structure des commits
- `feat:` Nouvelle fonctionnalité
- `fix:` Correction de bug
- `refactor:` Refactoring
- `test:` Ajout/modification de tests
- `docs:` Documentation

### Debugging
```bash
# Mode debug
python manage.py runserver --settings=coffee_meetings_platform.settings_debug

# Shell Django
python manage.py shell

# Logs SQL
# Ajouter dans settings.py pour voir les requêtes SQL
```

## Déploiement

### Production
- Utiliser PostgreSQL
- Configurer les variables d'environnement
- Désactiver DEBUG
- Configurer ALLOWED_HOSTS
- Utiliser un serveur WSGI (Gunicorn)

### Docker (optionnel)
```dockerfile
FROM python:3.9
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["gunicorn", "coffee_meetings_platform.wsgi:application"]
```
