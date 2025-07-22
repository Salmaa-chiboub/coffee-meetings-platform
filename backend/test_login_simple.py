#!/usr/bin/env python
"""
Test simple pour vérifier que le login et profile fonctionnent
"""
import requests
import json

def test_login_and_profile():
    """Test du login et du profile"""

    BASE_URL = "http://localhost:8000"

    # Données de test
    test_data = {
        "email": "salma@gmail.com",
        "password": "12345Salma&"
    }

    print("🧪 Test Login et Profile")
    print("=" * 40)

    try:
        # Test du login
        print("1. Test du login...")
        response = requests.post(
            f"{BASE_URL}/users/login/",
            json=test_data,
            headers={"Content-Type": "application/json"}
        )

        print(f"Status Code: {response.status_code}")

        if response.status_code == 200:
            print("✅ Login réussi!")
            data = response.json()
            access_token = data.get('access_token')

            if access_token:
                print(f"🔑 Token reçu: {access_token}")

                # Test du profile
                print("\n2. Test du profile...")
                headers = {
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json"
                }

                profile_response = requests.get(
                    f"{BASE_URL}/users/profile/",
                    headers=headers
                )

                print(f"Profile Status Code: {profile_response.status_code}")

                if profile_response.status_code == 200:
                    print("✅ Profile récupéré avec succès!")
                    profile_data = profile_response.json()
                    print("📋 Données du profile:")
                    print(json.dumps(profile_data, indent=2))
                else:
                    print("❌ Erreur lors de la récupération du profile")
                    print(f"Response: {profile_response.text}")
            else:
                print("⚠️ Pas de token dans la réponse")
        else:
            print("❌ Login échoué")
            print(f"Response: {response.text}")

    except requests.exceptions.ConnectionError:
        print("❌ Erreur de connexion. Assurez-vous que le serveur Django tourne sur http://localhost:8000")
    except Exception as e:
        print(f"❌ Erreur: {str(e)}")

if __name__ == "__main__":
    test_login_and_profile()
