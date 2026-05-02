from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
import os

User = get_user_model()

class Command(BaseCommand):
    help = 'Create a superuser if none exists'

    def handle(self, *args, **options):
        User = get_user_model()
        #username = os.environ.get('SUPERUSER_NAME', 'yemo')
        email =  'mbh2026@gmail'
        password = 'mbh2026'
        
        # On force la mise à jour ou la création de cet utilisateur précis
        try:
            user = User.objects.get(email=email)
            user.set_password(password)
            user.is_superuser = True
            #user.is_staff = True
            user.save()
            self.stdout.write(self.style.SUCCESS(f'Superuser "{email}" updated successfully.'))
        except User.DoesNotExist:
            User.objects.create_superuser(email=email,password=password)
            self.stdout.write(self.style.SUCCESS(f'Superuser "{email}" created successfully.'))
        