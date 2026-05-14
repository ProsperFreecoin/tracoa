import random
import string
from django.core.mail import send_mail
from django.conf import settings
from django.core.signing import Signer, BadSignature
from django.urls import reverse
from user.models import OTP, MagicLink

def generate_otp_code():
    """Génère un code à 6 chiffres aléatoire."""
    return ''.join(random.choices(string.digits, k=6))

def send_otp_email(user):
    """Génère et envoie un OTP à l'utilisateur."""
    # Désactiver les anciens OTP
    OTP.objects.filter(user=user, is_used=False).update(is_used=True)
    
    # Créer le nouvel OTP
    code = generate_otp_code()
    OTP.objects.create(user=user, code=code)
    
    # Envoyer l'email
    subject = "Code de vérification - Tracao"
    message = f"Bonjour {user.email},\n\nVotre code de vérification est : {code}\n\nCe code expirera dans 15 minutes."
    
    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@tracao.com',
        [user.email],
        fail_silently=False,
    )

def generate_magic_link_token(user):
    """Génère un token sécurisé pour le magic link et le sauvegarde."""
    # Désactiver les anciens magic links
    MagicLink.objects.filter(user=user, is_used=False).update(is_used=True)
    
    # Utiliser Signer pour créer un token sécurisé (inclut un salt et la SECRET_KEY)
    signer = Signer(salt='magic-link-transporter')
    
    # Le payload contient l'email et l'ID (utile mais protégé par la signature cryptographique)
    payload = f"{user.id}:{user.email}"
    token_hash = signer.sign(payload)
    
    MagicLink.objects.create(user=user, token_hash=token_hash)
    
    return token_hash

def send_magic_link_email(user, employer):
    """Envoie le lien magique au transporteur pour qu'il configure son mot de passe."""
    token = generate_magic_link_token(user)
    
    # Construction de l'URL frontend
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
    magic_link_url = f"{frontend_url}/set-password?token={token}"
    
    subject = "Création de votre compte Transporteur - Tracao"
    message = (
        f"Bonjour,\n\n"
        f"L'entité {employer.email} a créé un compte Transporteur pour vous sur Tracao.\n\n"
        f"Pour finaliser votre inscription et définir votre mot de passe, veuillez cliquer sur ce lien magique :\n"
        f"{magic_link_url}\n\n"
        f"Ce lien est valable 24 heures."
    )
    
    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@tracao.com',
        [user.email],
        fail_silently=False,
    )
