from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
import os

User = get_user_model()

class Command(BaseCommand):
    help = 'Create a superuser if none exists'

    def handle(self, *args, **options):
        # Utilisation de variables d'environnement pour la sécurité lors du déploiement
        email = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'mbh2026@gmail.com')
        password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'mbh2026')
        
        # On force la mise à jour ou la création de cet utilisateur précis
        try:
            user = User.objects.get(email=email)
            user.set_password(password)
            user.is_superuser = True
            user.is_staff = True  # Obligatoire pour se connecter au panel d'administration
            user.save()
            self.stdout.write(self.style.SUCCESS(f'Superuser "{email}" updated successfully.'))
        except User.DoesNotExist:
            User.objects.create_superuser(email=email, password=password)
            self.stdout.write(self.style.SUCCESS(f'Superuser "{email}" created successfully.'))
        