#!/usr/bin/env bash
# Arrêter le script si une commande échoue
set -o errexit

echo "📦 Installation des dépendances..."
pip install -r requirements.txt

echo "🎨 Collecte des fichiers statiques..."
python tracao/manage.py collectstatic --no-input

echo "🗄️ Application des migrations (création des tables)..."
python tracao/manage.py migrate

echo "👑 Création ou mise à jour du Super Admin..."
python tracao/manage.py set_superuser

echo " Là c'est pour la BD oooo"
python python tracao/reset_db.py


echo "✅ Build terminé avec succès !"
