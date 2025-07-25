# 🚀 Guide Postman - API Matching

Ce guide vous explique comment tester tous les endpoints de l'API Matching avec Postman.

## 📋 Prérequis

1. **Postman** installé
2. **Serveur Django** en cours d'exécution (`python manage.py runserver`)
3. **Token d'authentification** (JWT)
4. **Données de test** : Au moins une campagne et quelques employés

## 🔐 Configuration de l'Authentification

### 1. Obtenir un Token JWT

**Endpoint:** `POST http://localhost:8000/users/login/`

**Body (JSON):**
```json
{
    "email": "votre-email@example.com",
    "password": "votre-mot-de-passe"
}
```

**Réponse:**
```json
{
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "user": {...}
}
```

### 2. Configurer l'Authentification dans Postman

1. Dans Postman, aller dans **Headers**
2. Ajouter : `Authorization: Bearer YOUR_ACCESS_TOKEN`
3. Ou utiliser l'onglet **Authorization** → Type: **Bearer Token**

---

## 🎯 Endpoints Matching - Workflow Complet

### **Étape 1: Obtenir les Attributs Disponibles**

**GET** `http://localhost:8000/matching/campaigns/{campaign_id}/available-attributes/`

**Exemple:** `GET http://localhost:8000/matching/campaigns/1/available-attributes/`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
```

**Réponse Attendue:**
```json
{
    "available_attributes": ["department", "experience_level", "location"],
    "total_count": 3,
    "campaign_id": 1
}
```

---

### **Étape 2: Sauvegarder les Critères de Matching**

**POST** `http://localhost:8000/matching/campaigns/{campaign_id}/criteria/`

**Exemple:** `POST http://localhost:8000/matching/campaigns/1/criteria/`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
```

**Body (JSON):**
```json
{
    "criteria": [
        {
            "attribute_key": "department",
            "rule": "not_same"
        },
        {
            "attribute_key": "experience_level",
            "rule": "same"
        }
    ]
}
```

**Réponse Attendue:**
```json
{
    "success": true,
    "message": "Matching criteria saved successfully",
    "criteria_count": 2,
    "campaign_id": 1,
    "criteria": [
        {
            "id": 1,
            "attribute_key": "department",
            "rule": "not_same",
            "created_at": "2024-01-15T10:30:00Z"
        },
        {
            "id": 2,
            "attribute_key": "experience_level", 
            "rule": "same",
            "created_at": "2024-01-15T10:30:00Z"
        }
    ]
}
```

---

### **Étape 3: Générer les Paires**

**GET** `http://localhost:8000/matching/campaigns/{campaign_id}/generate-pairs/`

**Exemple:** `GET http://localhost:8000/matching/campaigns/1/generate-pairs/`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Paramètres de requête (optionnels):**
- `?limit=10` - Limiter le nombre de paires générées

**Réponse Attendue:**
```json
{
    "success": true,
    "pairs": [
        {
            "employee1_id": 1,
            "employee1_name": "Alice Dupont",
            "employee2_id": 3,
            "employee2_name": "Bob Martin",
            "matching_score": 0.85
        }
    ],
    "total_possible": 10,
    "total_generated": 5,
    "criteria_used": [
        {
            "attribute_key": "department",
            "rule": "not_same"
        }
    ],
    "existing_pairs_count": 0,
    "message": "5 pairs generated successfully"
}
```

---

### **Étape 4: Confirmer les Paires (avec envoi d'emails)**

**POST** `http://localhost:8000/matching/campaigns/{campaign_id}/confirm-pairs/`

**Exemple:** `POST http://localhost:8000/matching/campaigns/1/confirm-pairs/`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
```

**Body (JSON):**
```json
{
    "pairs": [
        {
            "employee1_id": 1,
            "employee2_id": 3
        },
        {
            "employee1_id": 2,
            "employee2_id": 4
        }
    ],
    "send_emails": true
}
```

**Réponse Attendue:**
```json
{
    "success": true,
    "message": "2 pairs confirmed and saved successfully",
    "confirmed_pairs": 2,
    "saved_pairs": [
        {
            "pair_id": 1,
            "employee1": "Alice Dupont",
            "employee2": "Bob Martin",
            "created_at": "2024-01-15T10:45:00Z"
        }
    ],
    "email_results": {
        "emails_sent": 4,
        "emails_failed": 0,
        "total_pairs": 2,
        "success_pairs": [1, 2],
        "failed_pairs": []
    }
}
```

---

## 📊 Endpoints de Consultation

### **Historique des Matchings**

**GET** `http://localhost:8000/matching/campaigns/{campaign_id}/history/`

**Exemple:** `GET http://localhost:8000/matching/campaigns/1/history/`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Paramètres de requête (optionnels):**
- `?page=1` - Pagination
- `?email_status=sent` - Filtrer par statut email
- `?search=Alice` - Rechercher par nom

**Réponse Attendue:**
```json
{
    "count": 5,
    "next": null,
    "previous": null,
    "results": [
        {
            "id": 1,
            "employee1": {
                "id": 1,
                "name": "Alice Dupont",
                "email": "alice@company.com"
            },
            "employee2": {
                "id": 3,
                "name": "Bob Martin", 
                "email": "bob@company.com"
            },
            "campaign": {
                "id": 1,
                "title": "Q4 2024 Connections"
            },
            "created_at": "2024-01-15T10:45:00Z",
            "email_status": "sent",
            "email_sent_at": "2024-01-15T10:46:00Z"
        }
    ]
}
```

---

### **Historique des Critères**

**GET** `http://localhost:8000/matching/campaigns/{campaign_id}/criteria-history/`

**Exemple:** `GET http://localhost:8000/matching/campaigns/1/criteria-history/`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Réponse Attendue:**
```json
{
    "campaign_id": 1,
    "campaign_title": "Q4 2024 Connections",
    "criteria": [
        {
            "id": 1,
            "attribute_key": "department",
            "rule": "not_same",
            "created_at": "2024-01-15T10:30:00Z",
            "created_by": "HR Manager",
            "is_locked": true
        }
    ],
    "total_criteria": 1,
    "is_locked": true
}
```

---

## 🧪 Collection Postman

### Créer une Collection

1. **Nouveau** → **Collection**
2. **Nom:** "Coffee Meetings - Matching API"
3. **Variables:**
   - `base_url`: `http://localhost:8000`
   - `token`: `YOUR_JWT_TOKEN`
   - `campaign_id`: `1`

### Organiser les Requêtes

**Dossier 1: Authentication**
- Login

**Dossier 2: Matching Workflow**
- Get Available Attributes
- Save Criteria
- Generate Pairs
- Confirm Pairs

**Dossier 3: History & Reports**
- Matching History
- Criteria History

---

## ⚠️ Gestion des Erreurs

### Erreurs Communes

**401 Unauthorized:**
```json
{
    "detail": "Given token not valid for any token type"
}
```
→ Vérifier le token JWT

**400 Bad Request:**
```json
{
    "success": false,
    "error": "No criteria defined for this campaign",
    "details": "Please define matching criteria first"
}
```
→ Définir les critères avant de générer des paires

**404 Not Found:**
```json
{
    "detail": "Not found."
}
```
→ Vérifier l'ID de campagne

---

## 🎯 Scénarios de Test

### Scénario 1: Workflow Complet
1. Login → Obtenir token
2. Get Available Attributes
3. Save Criteria
4. Generate Pairs
5. Confirm Pairs avec emails

### Scénario 2: Test d'Erreurs
1. Essayer de générer des paires sans critères
2. Confirmer des paires inexistantes
3. Utiliser un token expiré

### Scénario 3: Consultation
1. Voir l'historique des matchings
2. Consulter les critères utilisés
3. Filtrer par statut d'email

---

## 💡 Conseils Postman

1. **Variables d'environnement** pour `base_url` et `token`
2. **Tests automatiques** pour vérifier les réponses
3. **Pre-request scripts** pour rafraîchir le token
4. **Sauvegarde** de la collection pour partage

Bon testing ! 🚀
