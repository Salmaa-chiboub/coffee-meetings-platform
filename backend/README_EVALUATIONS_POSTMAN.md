# 📮 Guide Postman - API Evaluations

Guide complet pour tester l'API Evaluations avec Postman. Interface simplifiée avec seulement **2 endpoints RH essentiels** + endpoints publics.

## 🚀 Configuration Postman

### **1. Variables d'Environnement**

Créez un environnement "Coffee Meetings Evaluations" avec ces variables :

| Variable | Valeur | Description |
|----------|--------|-------------|
| `base_url` | `http://localhost:8000` | URL du serveur Django |
| `jwt_token` | *(vide - rempli automatiquement)* | Token JWT pour RH |
| `campaign_id` | `1` | ID d'une campagne existante |
| `evaluation_token` | *(à récupérer)* | Token UUID d'évaluation |

### **2. Obtenir un Token JWT RH**

**Endpoint :** `POST {{base_url}}/users/login/`

**Headers :**
```
Content-Type: application/json
```

**Body (JSON) :**
```json
{
    "email": "votre-email-rh@company.com",
    "password": "votre-mot-de-passe"
}
```

**Script Post-Response (Tests tab) :**
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("jwt_token", response.access_token);
    console.log("✅ JWT token saved: " + response.access_token.substring(0, 20) + "...");
} else {
    console.log("❌ Login failed: " + pm.response.text());
}
```

---

## 🏢 Endpoints RH (2 Essentiels)

### **1. 📝 Évaluations par Campagne**

**GET** `{{base_url}}/evaluations/campaigns/{{campaign_id}}/evaluations/`

**Description :** Afficher toutes les évaluations des participants d'une campagne

**Headers :**
```
Authorization: Bearer {{jwt_token}}
```

**Tests automatiques :**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has campaign evaluations", function () {
    const response = pm.response.json();
    pm.expect(response).to.have.property('campaign');
    pm.expect(response).to.have.property('statistics');
    pm.expect(response).to.have.property('evaluations');
    
    console.log("📋 Campagne: " + response.campaign.title);
    console.log("📊 Total évaluations: " + response.statistics.total_evaluations);
    console.log("📈 Taux réponse: " + response.statistics.response_rate + "%");
    
    if (response.statistics.average_rating) {
        console.log("⭐ Note moyenne: " + response.statistics.average_rating + "/5");
    }
});

pm.test("Evaluations list is array", function () {
    const response = pm.response.json();
    pm.expect(response.evaluations).to.be.an('array');
    
    if (response.evaluations.length > 0) {
        const firstEval = response.evaluations[0];
        pm.expect(firstEval).to.have.property('employee_name');
        pm.expect(firstEval).to.have.property('submitted');
        
        console.log("👤 Premier employé: " + firstEval.employee_name);
        console.log("✅ Statut: " + (firstEval.submitted ? "Soumise" : "En attente"));
    }
});
```

**Réponse Exemple :**
```json
{
    "success": true,
    "campaign": {
        "id": 1,
        "title": "Q4 2024 Cross-Department Connections"
    },
    "statistics": {
        "total_evaluations": 20,
        "response_rate": 85.0,
        "average_rating": 4.2
    },
    "evaluations": [
        {
            "id": 1,
            "employee_name": "Alice Dupont",
            "partner_name": "Bob Martin",
            "rating": 5,
            "comment": "Excellente discussion !",
            "submitted": true,
            "submitted_at": "2024-01-15T14:30:00Z"
        },
        {
            "id": 2,
            "employee_name": "Claire Rousseau",
            "partner_name": "David Leroy",
            "rating": null,
            "comment": null,
            "submitted": false,
            "submitted_at": null
        }
    ]
}
```

---

### **2. 📊 Statistiques par Campagne**

**GET** `{{base_url}}/evaluations/campaigns/{{campaign_id}}/statistics/`

**Description :** Métriques et statistiques détaillées d'une campagne

**Headers :**
```
Authorization: Bearer {{jwt_token}}
```

**Tests automatiques :**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has campaign statistics", function () {
    const response = pm.response.json();
    pm.expect(response).to.have.property('campaign_title');
    pm.expect(response).to.have.property('statistics');
    
    const stats = response.statistics;
    pm.expect(stats).to.have.property('total_pairs');
    pm.expect(stats).to.have.property('response_rate');
    
    console.log("📋 Campagne: " + response.campaign_title);
    console.log("👥 Paires totales: " + stats.total_pairs);
    console.log("📝 Évaluations générées: " + stats.total_evaluations_generated);
    console.log("✅ Évaluations soumises: " + stats.evaluations_submitted);
    console.log("⏳ En attente: " + stats.evaluations_pending);
    console.log("📈 Taux de réponse: " + stats.response_rate + "%");
    
    if (stats.average_rating) {
        console.log("⭐ Note moyenne: " + stats.average_rating + "/5");
    }
});

pm.test("Response rate is valid percentage", function () {
    const response = pm.response.json();
    const rate = response.statistics.response_rate;
    pm.expect(rate).to.be.within(0, 100);
});
```

**Réponse Exemple :**
```json
{
    "success": true,
    "campaign_id": 1,
    "campaign_title": "Q4 2024 Cross-Department Connections",
    "statistics": {
        "total_pairs": 10,
        "total_evaluations_generated": 20,
        "evaluations_submitted": 17,
        "evaluations_pending": 3,
        "response_rate": 85.0,
        "average_rating": 4.2,
        "total_ratings": 17
    }
}
```

---

## 🌐 Endpoints Publics (Employés)

### **3. 📋 Formulaire d'Évaluation**

**GET** `{{base_url}}/evaluations/evaluate/{{evaluation_token}}/`

**Description :** Afficher le formulaire d'évaluation pour un employé

**Headers :** *(Aucun - accès public)*

**Tests automatiques :**
```javascript
pm.test("Status code is 200 or 410", function () {
    pm.expect(pm.response.code).to.be.oneOf([200, 410]);
});

if (pm.response.code === 200) {
    pm.test("Evaluation form is available", function () {
        const response = pm.response.json();
        pm.expect(response).to.have.property('evaluation');
        pm.expect(response.evaluation).to.have.property('employee_name');
        pm.expect(response.evaluation).to.have.property('partner_name');
        
        console.log("👤 Employé: " + response.evaluation.employee_name);
        console.log("🤝 Partenaire: " + response.evaluation.partner_name);
        console.log("📋 Campagne: " + response.evaluation.campaign_title);
    });
}

if (pm.response.code === 410) {
    pm.test("Evaluation already submitted", function () {
        const response = pm.response.json();
        pm.expect(response).to.have.property('error');
        console.log("ℹ️ Évaluation déjà soumise");
    });
}
```

---

### **4. ✅ Soumettre une Évaluation**

**POST** `{{base_url}}/evaluations/evaluate/{{evaluation_token}}/submit/`

**Description :** Soumettre l'évaluation d'un employé

**Headers :**
```
Content-Type: application/json
```

**Body (JSON) :**
```json
{
    "rating": 4,
    "comment": "Excellente rencontre ! Discussion très enrichissante sur les projets inter-départements."
}
```

**Tests automatiques :**
```javascript
pm.test("Status code is 200 or 410", function () {
    pm.expect(pm.response.code).to.be.oneOf([200, 410, 400]);
});

if (pm.response.code === 200) {
    pm.test("Evaluation submitted successfully", function () {
        const response = pm.response.json();
        pm.expect(response).to.have.property('success', true);
        pm.expect(response).to.have.property('message');
        console.log("✅ " + response.message);
    });
}

if (pm.response.code === 400) {
    pm.test("Validation error handled", function () {
        const response = pm.response.json();
        pm.expect(response).to.have.property('error');
        console.log("❌ Erreur de validation: " + JSON.stringify(response.details));
    });
}
```

---

## 🔐 Tests de Sécurité

### **5. 🚫 Accès Sans Authentification**

**GET** `{{base_url}}/evaluations/campaigns/{{campaign_id}}/evaluations/`

**Headers :** *(Aucun)*

**Tests automatiques :**
```javascript
pm.test("Access denied without authentication", function () {
    pm.expect(pm.response.code).to.be.oneOf([401, 403]);
    console.log("✅ Accès correctement bloqué sans authentification");
});
```

---

## 📋 Collection Postman Complète

### **Ordre de Test Recommandé :**

1. **🔐 Authentication**
   - Login RH Manager

2. **🏢 Endpoints RH**
   - Évaluations par Campagne
   - Statistiques par Campagne

3. **🌐 Endpoints Publics**
   - Formulaire d'Évaluation
   - Soumettre Évaluation

4. **🔐 Tests de Sécurité**
   - Accès sans authentification

### **Scripts Globaux**

**Pre-request Script (Collection level) :**
```javascript
// Vérifier que les variables nécessaires sont définies
const requiredVars = ['base_url'];
requiredVars.forEach(varName => {
    if (!pm.environment.get(varName)) {
        console.log("⚠️ Variable manquante: " + varName);
    }
});

// Log de la requête
console.log("🚀 " + pm.request.method + " " + pm.request.url);
```

**Test Script (Collection level) :**
```javascript
// Log du temps de réponse
console.log("⏱️ Temps de réponse: " + pm.response.responseTime + "ms");

// Log des erreurs
if (pm.response.code >= 400) {
    console.log("❌ Erreur " + pm.response.code + ": " + pm.response.text());
}
```

---

## 💡 Conseils d'Utilisation

### **1. Obtenir un Token d'Évaluation :**

**Méthode 1 - Base de Données (Recommandée) :**
```sql
SELECT token, employee_id, used
FROM evaluations_evaluation
WHERE used = false
LIMIT 5;
```

**Méthode 2 - Shell Django :**
```bash
python manage.py shell
```
```python
from evaluations.models import Evaluation
token = Evaluation.objects.filter(used=False).first().token
print(f"Token: {token}")
```

**Méthode 3 - Créer un Token de Test :**
```python
# Dans le shell Django
from evaluations.models import Evaluation
from matching.models import EmployeePair
import uuid

pair = EmployeePair.objects.first()
if pair:
    eval_test = Evaluation.objects.create(
        employee=pair.employee1,
        employee_pair=pair,
        token=uuid.uuid4(),
        used=False
    )
    print(f"Token de test: {eval_test.token}")
```

**Méthode 4 - Via les Emails :**
Les tokens sont inclus dans les emails envoyés aux employés lors de la confirmation des paires.

Copiez le token obtenu dans la variable Postman `evaluation_token`

### **2. Tester Différents Scénarios :**
- **Token valide** : Formulaire accessible, soumission possible
- **Token utilisé** : Erreur 410 "Already submitted"
- **Token invalide** : Erreur 404 "Not found"

### **3. Validation des Données :**
- **Rating** : Entre 1 et 5 (optionnel)
- **Comment** : Texte libre (optionnel)
- **Au moins un champ** requis

### **4. Gestion des Erreurs :**
- **401/403** : Problème d'authentification
- **404** : Ressource non trouvée
- **410** : Évaluation déjà soumise
- **400** : Données invalides

---

## 🎯 Résumé

L'API Evaluations est maintenant **simple et efficace** avec :

- ✅ **2 endpoints RH** pour consulter les évaluations
- ✅ **2 endpoints publics** pour les employés
- ✅ **Authentification sécurisée** par JWT
- ✅ **Validation robuste** des données
- ✅ **Interface claire** pour les RH

**Prêt pour la production ! 🚀**
