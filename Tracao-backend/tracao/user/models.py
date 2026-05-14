from django.db import models
from django.contrib.auth.models import AbstractBaseUser,PermissionsMixin
from phonenumber_field.modelfields import PhoneNumberField
from django_countries.fields import CountryField
from django.contrib.auth.models import BaseUserManager
from django.utils import timezone
from datetime import timedelta



# Create User Model and manager for more customization and control over user authentication

class CustomUserManager(BaseUserManager):
    def create_user(self,email,password=None,**extra_fields):
        if not email:
            raise ValueError('Users must have an email address')

        email = self.normalize_email(email)

        extra_fields.setdefault('is_transporter', False)
        extra_fields.setdefault('is_farmer', False)
        extra_fields.setdefault('is_buyer', False)
        extra_fields.setdefault('is_transformer', False) # Entreprises locales de transformation
        extra_fields.setdefault('is_private_buyer', False) # C'est indirectement l'exportateur aussi en même temps les personnes voulant stocker personnelement des produits
        # extra_fields.setdefault('is_eu_buyer', False) # Entreprises européennes de transformation
        # extra_fields.setdefault('is_ue_private_buyer', False) # l'importateur privé de l'UE
        extra_fields.setdefault('is_store', False) # Magasins lacaux qui exportent ou vendent aussi aux transformateurs
        extra_fields.setdefault('country', 'Togo')
        extra_fields.setdefault('city', 'Lome')
        # extra_fields.setdefault('is_certifier', False)

        user = self.model(
            email=email,
           **extra_fields
        )

        user.set_password(password)
        user.save(using=self._db)
        return user



    def create_superuser(self,email,password=None,**extra_fields):

        email=self.normalize_email(email)
        
        
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_staff', True) 

        extra_fields.setdefault('is_transporter', True)
        extra_fields.setdefault('is_farmer', True)
        extra_fields.setdefault('is_buyer', True)
        extra_fields.setdefault('is_transformer', True) # Entreprises locales de transformation
        extra_fields.setdefault('is_private_buyer', True) # C'est indirectement l'exportateur aussi en même temps les personnes voulant stocker personnelement des produits
        # extra_fields.setdefault('is_eu_buyer', True) # Entreprises européennes de transformation
        # extra_fields.setdefault('is_ue_private_buyer', True) # l'importateur privé de l'UE
        extra_fields.setdefault('is_store', True) # Magasins lacaux qui exportent ou vendent aussi aux transformateurs
        extra_fields.setdefault('country', 'Togo')
        extra_fields.setdefault('city', 'Lome')

        return self.create_user(email, password, **extra_fields)


# The Custom User Model

class TracaoUser(AbstractBaseUser,PermissionsMixin):

    # Global
    email = models.EmailField(unique=True)
    phone_number = PhoneNumberField(blank=True,null=True)
    country = CountryField(blank_label='(Sélectionnez un pays)',default="Togo",blank=True,null=True)

    # individuel ( farmer / buyer )
    cooperative_name = models.CharField(max_length=200,blank=True,null=True) # for farmer uniquement
    first_name = models.CharField(max_length=200,blank=True,null=True)
    last_name = models.CharField(max_length=200,blank=True,null=True)
    situation_geo = models.CharField(max_length=100,default="Lome",blank=True,null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # organistaion
    person_to_call = models.CharField(max_length=200,blank=True,null=True)
    ptc_number = PhoneNumberField(blank=True,null=True)

    org_name = models.CharField(max_length=200,blank=True,null=True)
    address = models.CharField(max_length=200,blank=True,null=True)
    certification = models.FileField(upload_to='certifications/',blank=True,null=True)

    # institution
    legal_number = models.IntegerField(blank=True,null=True)
    website = models.CharField(max_length=200,blank=True,null=True)

    # organistation
    record_number = models.IntegerField(blank=True,null=True)
    tax_number = models.IntegerField(blank=True,null=True)

    # Magasin
    store_name = models.CharField(max_length=200,blank=True,null=True)
    store_address = models.CharField(max_length=200,blank=True,null=True)
    store_certification = models.FileField(upload_to='certifications/',blank=True,null=True)



    # Relation : un transporter est engagé par une entité (Store, Farmer, Buyer, Company, Institution)
    # La validation du type d'entité est faite côté API
    hired_by = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='transporters',
    )

    is_transporter = models.BooleanField(default=False)
    is_farmer = models.BooleanField(default=False)
    is_buyer = models.BooleanField(default=False)
    is_transformer = models.BooleanField(default=False)
    is_private_buyer = models.BooleanField(default=False)
    # is_eu_buyer = models.BooleanField(default=False)
    # is_ue_private_buyer = models.BooleanField(default=False)
    is_store = models.BooleanField(default=False)
    

    
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    
    # OTP Validation
    is_verified = models.BooleanField(default=False)
    
    objects = CustomUserManager()
    
    
    USERNAME_FIELD = 'email'
    #REQUIRED_FIELDS = ['first_name','last_name','phone_number','country','city']
    
    
    def __str__(self):
        return self.email

    




# User profil picture




class ProfilePic(models.Model):
    user = models.OneToOneField(TracaoUser, on_delete=models.CASCADE)
    profile_picture = models.ImageField(upload_to='profile_pictures', blank=True, null=True)
    
    def __str__(self):
        return self.user.email

class KYCDocument(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'En attente'),
        ('APPROVED', 'Approuvé'),
        ('REJECTED', 'Rejeté'),
    ]
    user = models.OneToOneField(TracaoUser, on_delete=models.CASCADE, related_name='kyc_document')
    id_card_front = models.ImageField(upload_to='kyc_documents/front/', blank=True, null=True, verbose_name="Carte d'identité (Recto)")
    id_card_back = models.ImageField(upload_to='kyc_documents/back/', blank=True, null=True, verbose_name="Carte d'identité (Verso)")
    selfie_photo = models.ImageField(upload_to='kyc_documents/selfie/', blank=True, null=True, verbose_name="Selfie avec la carte")
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING', verbose_name="Statut KYC")
    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True, null=True, verbose_name="Motif de rejet")
    
    def __str__(self):
        return f"KYC pour {self.user.email} - {self.get_status_display()}"


# OTP & Magic Links Models

def get_otp_expiration():
    from django.utils import timezone
    from datetime import timedelta
    return timezone.now() + timedelta(minutes=15)

def get_magic_link_expiration():
    from django.utils import timezone
    from datetime import timedelta
    return timezone.now() + timedelta(hours=24)

class OTP(models.Model):
    user = models.ForeignKey(TracaoUser, on_delete=models.CASCADE, related_name="otps")
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(default=get_otp_expiration)
    is_used = models.BooleanField(default=False)

    def is_valid(self):
        from django.utils import timezone
        return not self.is_used and timezone.now() <= self.expires_at

    def __str__(self):
        return f"OTP for {self.user.email} ({self.code})"


class MagicLink(models.Model):
    user = models.ForeignKey(TracaoUser, on_delete=models.CASCADE, related_name="magic_links")
    token_hash = models.CharField(max_length=128, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(default=get_magic_link_expiration)
    is_used = models.BooleanField(default=False)

    def is_valid(self):
        from django.utils import timezone
        return not self.is_used and timezone.now() <= self.expires_at

    def __str__(self):
        return f"Magic Link for {self.user.email}"
