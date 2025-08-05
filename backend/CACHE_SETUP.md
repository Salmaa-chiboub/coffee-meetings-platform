# Guide d'Installation de Redis et Configuration du Cache

## 1. Installation de Redis

### Sur Windows :
1. Téléchargez Redis pour Windows depuis https://github.com/microsoftarchive/redis/releases
2. Installez Redis en suivant les instructions d'installation
3. Vérifiez que Redis est en cours d'exécution en ouvrant PowerShell et en tapant :
   ```powershell
   redis-cli ping
   ```
   Vous devriez recevoir "PONG" comme réponse

### Sur Linux :
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

## 2. Installation des dépendances Python

```bash
pip install -r requirements.txt
```

## 3. Vérification de la Configuration

1. Assurez-vous que Redis est en cours d'exécution
2. Vérifiez la connexion dans Django shell :
   ```python
   python manage.py shell
   >>> from django.core.cache import cache
   >>> cache.set('test_key', 'test_value', 300)
   >>> cache.get('test_key')
   'test_value'
   ```

## 4. Configuration de la Production

Pour la production, modifiez les paramètres suivants dans cache_settings.py :

1. Changez l'hôte Redis si nécessaire
2. Ajustez les timeouts en fonction des besoins
3. Configurez le préfixe des clés
4. Ajustez les paramètres de pool de connexions

## 5. Monitoring

1. Surveillez les logs de performance dans `logs/performance.log`
2. Utilisez redis-cli pour monitorer l'utilisation du cache :
   ```bash
   redis-cli info | grep used_memory
   redis-cli info | grep connected_clients
   ```

## 6. Maintenance

1. Nettoyage périodique du cache :
   ```bash
   redis-cli FLUSHDB  # Vide la base de données actuelle
   redis-cli FLUSHALL # Vide toutes les bases de données
   ```

2. Surveillance des métriques :
   - Taux de hits/miss du cache
   - Utilisation de la mémoire
   - Temps de réponse des requêtes

## 7. Dépannage

1. Si Redis ne démarre pas :
   - Vérifiez les logs : `sudo systemctl status redis-server`
   - Vérifiez la configuration : `/etc/redis/redis.conf`

2. Si le cache ne fonctionne pas :
   - Vérifiez la connexion à Redis
   - Vérifiez les paramètres CACHES dans settings.py
   - Vérifiez les logs Django
