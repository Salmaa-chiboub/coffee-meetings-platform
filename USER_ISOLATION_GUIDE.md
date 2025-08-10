# Guide d'Isolation des Utilisateurs

## Vue d'ensemble

Ce document décrit l'implémentation de la séparation complète des données entre utilisateurs dans la plateforme Coffee Meetings. Chaque utilisateur (HR Manager) ne peut accéder qu'à ses propres données : campagnes, employees, matching, evaluations, et notifications.

## Architecture de Séparation

### 1. Modèle de Données

#### HRManager (Utilisateur Principal)
- Chaque utilisateur est un `HRManager` avec un email unique
- Authentification via JWT avec `user_id` dans le payload
- Chaque ressource est liée à un `hr_manager` via une ForeignKey

#### Relations Hiérarchiques
```
HRManager (1) ←→ (N) Campaign
Campaign (1) ←→ (N) Employee
Campaign (1) ←→ (N) EmployeePair
Campaign (1) ←→ (N) CampaignMatchingCriteria
EmployeePair (1) ←→ (N) Evaluation
HRManager (1) ←→ (N) Notification
```

### 2. Permissions par Module

#### Campaigns
- **Permission**: `IsCampaignOwner`
- **Filtrage**: `Campaign.objects.filter(hr_manager=request.user)`
- **Création**: `serializer.save(hr_manager=request.user)`

#### Employees
- **Permission**: `IsEmployeeOwner`
- **Filtrage**: Via les campagnes de l'utilisateur
- **Accès**: Seulement aux employees des campagnes de l'utilisateur

#### Matching
- **Permission**: `IsMatchingOwner`
- **Filtrage**: Via les campagnes de l'utilisateur
- **Accès**: Seulement aux critères et paires des campagnes de l'utilisateur

#### Evaluations
- **Permission**: `IsEvaluationOwner`
- **Filtrage**: Via les campagnes de l'utilisateur
- **Accès**: Seulement aux evaluations des paires de l'utilisateur

#### Notifications
- **Permission**: `IsNotificationOwner`
- **Filtrage**: `Notification.objects.filter(recipient=request.user)`
- **Accès**: Seulement aux notifications de l'utilisateur

### 3. Middleware d'Audit

Le `UserDataIsolationMiddleware` :
- Log toutes les requêtes avec l'ID utilisateur
- Vérifie que les réponses ne contiennent que les données autorisées
- Gère les exceptions liées à l'isolation

## Implémentation Technique

### Permissions Personnalisées

Chaque module a sa propre classe de permission :

```python
class IsEmployeeOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if obj.campaign:
            return obj.campaign.hr_manager == request.user
        return False
```

### Filtrage des Querysets

Toutes les vues filtrent automatiquement par utilisateur :

```python
def get_queryset(self):
    user_campaign_ids = Campaign.objects.filter(
        hr_manager=self.request.user
    ).values_list('id', flat=True)
    return Employee.objects.filter(campaign_id__in=user_campaign_ids)
```

### Vérification des Accès

Pour les endpoints avec `campaign_id` :

```python
campaign = get_object_or_404(
    Campaign, 
    id=campaign_id, 
    hr_manager=request.user
)
```

## Tests de Sécurité

### Script de Test Automatisé

Le script `test_user_isolation.py` vérifie :

1. **Isolation des Campagnes**
   - User1 ne voit que ses campagnes
   - User1 ne peut pas accéder aux campagnes de User2

2. **Isolation des Employees**
   - User1 ne voit que ses employees
   - User1 ne peut pas accéder aux employees de User2

3. **Isolation des Endpoints**
   - Tous les endpoints respectent la séparation
   - Les tentatives d'accès non autorisé retournent 404

### Exécution des Tests

```bash
cd backend
python test_user_isolation.py
```

## Bonnes Pratiques

### 1. Création de Données
- Toujours associer automatiquement le `hr_manager` lors de la création
- Utiliser `perform_create()` dans les ViewSets

### 2. Requêtes Optimisées
- Utiliser `select_related()` et `prefetch_related()` pour éviter les N+1
- Filtrer d'abord par utilisateur, puis par autres critères

### 3. Validation des Accès
- Vérifier les permissions au niveau des vues
- Utiliser `get_object_or_404()` avec filtres utilisateur

### 4. Logging et Audit
- Logger tous les accès aux données sensibles
- Surveiller les tentatives d'accès non autorisé

## Endpoints Sécurisés

### Campaigns
- `GET /campaigns/` - Liste filtrée par utilisateur
- `POST /campaigns/` - Création avec hr_manager automatique
- `GET /campaigns/{id}/` - Accès seulement si propriétaire
- `PUT/PATCH /campaigns/{id}/` - Modification seulement si propriétaire
- `DELETE /campaigns/{id}/` - Suppression seulement si propriétaire

### Employees
- `GET /employees/` - Liste filtrée par campagnes utilisateur
- `POST /employees/` - Création dans campagnes utilisateur
- `GET /employees/by_campaign/?campaign_id=X` - Vérification propriétaire

### Matching
- `GET /matching/campaigns/{id}/available-attributes/` - Vérification propriétaire
- `POST /matching/campaigns/{id}/criteria/` - Vérification propriétaire
- `GET /matching/campaigns/{id}/generate-pairs/` - Vérification propriétaire

### Evaluations
- `GET /evaluations/campaigns/{id}/results/` - Vérification propriétaire
- `GET /evaluations/campaigns/{id}/statistics/` - Vérification propriétaire

### Notifications
- `GET /notifications/` - Liste filtrée par utilisateur
- `PATCH /notifications/{id}/` - Modification seulement si propriétaire

## Sécurité Supplémentaire

### 1. Validation des Tokens
- Vérification de l'expiration des JWT
- Validation du `user_id` dans le payload

### 2. Rate Limiting
- Limitation des tentatives de connexion
- Protection contre les attaques par force brute

### 3. Audit Trail
- Logging de toutes les actions sensibles
- Traçabilité des modifications de données

## Monitoring et Alertes

### Logs à Surveiller
- Tentatives d'accès non autorisé
- Erreurs de permission
- Accès aux données d'autres utilisateurs

### Métriques Importantes
- Nombre de requêtes par utilisateur
- Temps de réponse des endpoints
- Taux d'erreur 404/403

## Conclusion

L'isolation des utilisateurs est maintenant complètement implémentée avec :
- ✅ Séparation des données par utilisateur
- ✅ Permissions granulaires par module
- ✅ Validation des accès à tous les niveaux
- ✅ Audit et logging complets
- ✅ Tests automatisés de sécurité

Chaque utilisateur dispose de son propre espace de travail isolé et sécurisé.
