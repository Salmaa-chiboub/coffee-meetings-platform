from django.core.management.base import BaseCommand
from django.core.cache import cache
from django.conf import settings
import time

class Command(BaseCommand):
    help = 'Gère le cache Redis'

    def add_arguments(self, parser):
        parser.add_argument(
            '--action',
            type=str,
            help='Action à effectuer (clear, stats, test)',
        )

    def handle(self, *args, **options):
        action = options['action']
        
        if action == 'clear':
            self.clear_cache()
        elif action == 'stats':
            self.show_stats()
        elif action == 'test':
            self.test_cache()
        else:
            self.stdout.write(
                self.style.ERROR('Action non reconnue. Utilisez clear, stats ou test')
            )

    def clear_cache(self):
        """Vide le cache"""
        cache.clear()
        self.stdout.write(
            self.style.SUCCESS('Cache vidé avec succès')
        )

    def show_stats(self):
        """Affiche les statistiques du cache"""
        if hasattr(cache, 'info'):
            info = cache.info()
            self.stdout.write(self.style.SUCCESS('Statistiques du cache :'))
            for key, value in info.items():
                self.stdout.write(f'{key}: {value}')
        else:
            self.stdout.write(
                self.style.WARNING('Statistiques non disponibles pour ce backend de cache')
            )

    def test_cache(self):
        """Teste les performances du cache"""
        # Test d'écriture
        start = time.time()
        for i in range(1000):
            cache.set(f'test_key_{i}', f'value_{i}', 300)
        write_time = time.time() - start
        
        # Test de lecture
        start = time.time()
        for i in range(1000):
            cache.get(f'test_key_{i}')
        read_time = time.time() - start
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Test terminé :\n'
                f'Temps d\'écriture : {write_time:.2f}s\n'
                f'Temps de lecture : {read_time:.2f}s\n'
                f'Opérations par seconde : {2000/(write_time+read_time):.0f}'
            )
        )
        
        # Nettoyage
        for i in range(1000):
            cache.delete(f'test_key_{i}')
