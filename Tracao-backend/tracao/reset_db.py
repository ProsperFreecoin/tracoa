import os
import django

# Initialiser Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tracao.settings')
django.setup()

from django.db import connection

print("⚠️  Suppression de la base de données PostgreSQL (Drop Schema)...")
with connection.cursor() as cursor:
    cursor.execute('DROP SCHEMA public CASCADE;')
    cursor.execute('CREATE SCHEMA public;')
    cursor.execute('GRANT ALL ON SCHEMA public TO postgres;')
    cursor.execute('GRANT ALL ON SCHEMA public TO public;')

print("✅ Base de données réinitialisée avec succès ! Les tables ont été effacées.")
