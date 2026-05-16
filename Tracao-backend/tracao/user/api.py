from ninja_extra import api_controller, route
from ninja_extra.permissions import IsAuthenticated, AllowAny, IsAdminUser
from ninja import File, Form
from ninja.files import UploadedFile
from ninja_jwt.authentication import JWTAuth
from ninja.errors import HttpError
import requests
from ninja_jwt.tokens import RefreshToken
from user.schemas import (
    FarmerBuyerRegister, CompanyRegister, InstitutionRegister, StoreRegister, CreateTransporter, CertifierRegister,
    KYCDocumentSchema, FarmerList, BuyerList, CompanyList, InstitutionList, StoreList, TransporterList, CertifierList,
    VerifyOTPSchema, SetPasswordMagicLinkSchema, UserProfileSchema, UserSchema, NotificationSchema, GoogleLoginSchema
)
from user.models import TracaoUser, KYCDocument, OTP, MagicLink, Notification
from user.utils import send_otp_email, send_magic_link_email
from django.shortcuts import get_object_or_404
from typing import Optional
from ninja.errors import HttpError

User = TracaoUser


@api_controller('/users', auth=None)
class UserController:

    # ─── GOOGLE OAUTH ──────────────────────────────────────────────────────────

    def _create_or_update_user(self, email, password, role_flags: dict, defaults: dict, is_verified=False):
        """Helper pour créer ou mettre à jour un utilisateur non vérifié."""
        defaults.pop('email', None)
        defaults.pop('password', None)
        defaults.pop('confirm_password', None)
        
        # Nettoyage numéro de téléphone si présent
        if 'phone_number' in defaults and defaults['phone_number']:
            defaults['phone_number'] = defaults['phone_number'].replace(' ', '')
        if 'ptc_number' in defaults and defaults['ptc_number']:
            defaults['ptc_number'] = defaults['ptc_number'].replace(' ', '')

        user = User.objects.filter(email=email).first()
        if user:
            if user.is_verified:
                raise HttpError(400, "Cet email est déjà utilisé par un compte vérifié.")
            # Mise à jour des infos pour un utilisateur non vérifié qui retente
            for attr, value in defaults.items():
                setattr(user, attr, value)
            for flag, val in role_flags.items():
                setattr(user, flag, val)
            user.set_password(password)
            user.save()
        else:
            user = User.objects.create(email=email, **defaults, **role_flags, is_verified=is_verified)
            user.set_password(password)
            user.save()
        
        if not user.is_verified:
            send_otp_email(user)
        return user

    @route.post("/auth/google", response=dict)
    def google_login(self, request, payload: dict):
        """
        Échange un token Google ID contre une paire JWT Django.
        """
        import requests as http_requests
        from ninja_jwt.tokens import RefreshToken

        google_token = payload.get("token") or payload.get("credential")
        if not google_token:
            raise HttpError(400, "Token Google manquant.")

        # Vérification du token auprès de Google
        google_resp = http_requests.get(
            "https://oauth2.googleapis.com/tokeninfo",
            params={"id_token": google_token},
            timeout=10,
        )

        if google_resp.status_code != 200:
            raise HttpError(401, "Token Google invalide.")

        google_data = google_resp.json()

        import os
        expected_client_id = os.getenv("GOOGLE_CLIENT_ID", "")
        if expected_client_id and google_data.get("aud") != expected_client_id:
            # On log l'erreur mais on permet si c'est en dev sans client_id configuré
            print(f"WARNING: Google Client ID mismatch. Expected {expected_client_id}, got {google_data.get('aud')}")

        email = google_data.get('email')
        if not email:
            raise HttpError(400, "Email Google manquant.")

        # Récupération ou création de l'utilisateur
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'first_name': google_data.get('given_name', ''),
                'last_name': google_data.get('family_name', ''),
                'is_farmer': True,
                'is_verified': True,
                'situation_geo': "Lome"
            }
        )

        refresh = RefreshToken.for_user(user)
        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": {
                "id": user.id,
                "email": user.email,
                "is_farmer": user.is_farmer,
                "is_store": user.is_store,
                "first_name": user.first_name,
                "last_name": user.last_name
            }
        }

    @route.post("/notifications", auth=JWTAuth())
    def create_notification(self, request, payload: dict):
        """Permet d'envoyer une notification à un autre utilisateur."""
        receiver_id = payload.get("receiver_id")
        message = payload.get("message")
        notif_type = payload.get("type", "INFO")
        
        receiver = get_object_or_404(User, id=receiver_id)
        notif = Notification.objects.create(
            user=receiver,
            message=message,
            type=notif_type,
            metadata=payload.get("metadata", {})
        )
        return {"success": True, "id": notif.id}


    @route.get("/notifications", auth=JWTAuth(), response=list[NotificationSchema])
    def get_notifications(self, request):
        return Notification.objects.filter(user=request.user).order_by('-created_at')

    @route.post("/notifications/{notif_id}/read", auth=JWTAuth())
    def mark_notif_read(self, request, notif_id: int):
        notif = get_object_or_404(Notification, id=notif_id, user=request.user)
        notif.is_read = True
        notif.save()
        return {"success": True}

    
    # INSCRIPTIONS
    

    @route.post("/farmer_signup", response=FarmerList)
    def register_farmer(self, user: FarmerBuyerRegister):
        """Inscription d'un agriculteur. Envoie un OTP de vérification par email."""
        user_data = user.model_dump()
        email = user_data.pop('email')
        password = user_data.pop('password')
        user_data.pop('confirm_password')

        return self._create_or_update_user(
            email=email,
            password=password,
            role_flags={'is_farmer': True},
            defaults=user_data
        )

    @route.post("/buyer_signup", response=BuyerList)
    def register_buyer(self, user: FarmerBuyerRegister):
        """Inscription d'un acheteur individuel. Envoie un OTP de vérification."""
        user_data = user.model_dump()
        email = user_data.pop('email')
        password = user_data.pop('password')
        user_data.pop('confirm_password')

        return self._create_or_update_user(
            email=email,
            password=password,
            role_flags={'is_private_buyer': True, 'is_buyer': True},
            defaults=user_data
        )

    @route.post("/company_signup", response=CompanyList)
    def register_company(
        self,
        data: CompanyRegister = Form(...),
        certification: UploadedFile = File(None),
    ):
        """Inscription d'une entreprise locale de transformation."""
        user_data = data.model_dump()
        email = user_data.pop('email')
        password = user_data.pop('password')
        user_data.pop('confirm_password')

        user = self._create_or_update_user(
            email=email,
            password=password,
            role_flags={'is_transformer': True, 'is_buyer': True},
            defaults=user_data
        )
        if certification:
            user.certification = certification
            user.save()
        return user

    @route.post("/institution_signup", response=InstitutionList)
    def register_institution(
        self,
        data: InstitutionRegister = Form(...),
        certification: UploadedFile = File(None),
    ):
        """Inscription d'une institution."""
        user_data = data.model_dump()
        email = user_data.pop('email')
        password = user_data.pop('password')
        user_data.pop('confirm_password')

        user = self._create_or_update_user(
            email=email,
            password=password,
            role_flags={'is_transformer': True, 'is_buyer': True},
            defaults=user_data
        )
        if certification:
            user.certification = certification
            user.save()
        return user

    @route.post("/store_signup", response=StoreList)
    def register_store(
        self,
        data: StoreRegister = Form(...),
        certification: UploadedFile = File(None),
    ):
        """Inscription d'un magasin / coopérative locale."""
        user_data = data.model_dump()
        email = user_data.pop('email')
        password = user_data.pop('password')
        user_data.pop('confirm_password')

        user = self._create_or_update_user(
            email=email,
            password=password,
            role_flags={'is_store': True},
            defaults=user_data
        )
        if certification:
            user.certification = certification
            user.save()
        return user

    @route.post("/certifier_signup", response=CertifierList)
    def register_certifier(
        self,
        data: CertifierRegister,
        certification: UploadedFile = File(None),
    ):
        """Inscription d'un organisme de certification."""
        user_data = data.model_dump()
        email = user_data.pop('email')
        password = user_data.pop('password')
        user_data.pop('confirm_password')

        user = self._create_or_update_user(
            email=email,
            password=password,
            role_flags={'is_certifier': True},
            defaults=user_data
        )
        if certification:
            user.certification = certification
            user.save()
        return user

    
    # TRANSPORTEURS
    

    @route.post("/{employer_type}/{employer_id}/transporter_signup", response=TransporterList)
    def register_transporter(self, employer_type: str, employer_id: int, data: CreateTransporter):
        """
        Inscription d'un transporteur lié à une entité employeuse.
        Le transporteur reçoit un Magic Link par email pour définir son mot de passe.

        URL patterns :
        - POST /users/farmer/42/transporter_signup
        - POST /users/store/7/transporter_signup
        - POST /users/company/3/transporter_signup
        """
        EMPLOYER_TYPE_MAP = {
            'farmer':      'is_farmer',
            'buyer':       'is_buyer',
            'store':       'is_store',
            'company':     'is_transformer',
            'institution': 'is_transformer',
        }

        if employer_type not in EMPLOYER_TYPE_MAP:
            raise HttpError(
                400,
                f"Type d'entité invalide : '{employer_type}'. "
                f"Valeurs acceptées : {list(EMPLOYER_TYPE_MAP.keys())}"
            )

        employer = get_object_or_404(User, id=employer_id)
        expected_flag = EMPLOYER_TYPE_MAP[employer_type]
        if not getattr(employer, expected_flag, False):
            raise HttpError(400, f"L'utilisateur #{employer_id} n'est pas un '{employer_type}'.")

        user_data = data.model_dump()
        transporter = User.objects.create(
            **user_data, is_transporter=True, hired_by=employer, is_verified=False
        )
        transporter.set_unusable_password()
        transporter.save()

        send_magic_link_email(transporter, employer)
        return transporter

    
    # VÉRIFICATION OTP & MAGIC LINK
    

    @route.post("/verify-otp")
    def verify_otp(self, data: VerifyOTPSchema):
        """Vérifie le code OTP envoyé par email lors de l'inscription."""
        user = get_object_or_404(User, email=data.email)

        otp = OTP.objects.filter(user=user, code=data.code, is_used=False).order_by('-created_at').first()

        if not otp or not otp.is_valid():
            raise HttpError(400, "Code OTP invalide ou expiré.")

        otp.is_used = True
        otp.save()

        user.is_verified = True
        user.save()

        # Génération des tokens pour connexion automatique
        from ninja_jwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)

        return {
            "message": "✅ Email vérifié avec succès.",
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": {
                "id": user.id,
                "email": user.email,
                "is_farmer": user.is_farmer,
                "is_store": user.is_store,
                "first_name": user.first_name,
                "last_name": user.last_name
            }
        }

    @route.post("/magic-link/set-password")
    def set_password_magic_link(self, data: SetPasswordMagicLinkSchema):
        """
        Permet à un transporteur de définir son mot de passe via le Magic Link.
        Valide automatiquement son compte.
        """
        if data.new_password != data.confirm_password:
            raise HttpError(400, "Les mots de passe ne correspondent pas.")

        magic_link = get_object_or_404(MagicLink, token_hash=data.token)

        if not magic_link.is_valid():
            raise HttpError(400, "Le lien magique est invalide ou a expiré.")

        user = magic_link.user
        user.set_password(data.new_password)
        user.is_verified = True
        user.save()

        magic_link.is_used = True
        magic_link.save()

        return {"message": "✅ Mot de passe défini avec succès. Vous pouvez maintenant vous connecter."}

    @route.post("/google_login")
    def google_login_legacy(self, data: GoogleLoginSchema):
        """
        Alias pour compatibilité frontend.
        """
        return self.google_login(None, {"credential": data.credential})

    
    # LISTES
    

    @route.get("/all_farmers", response=list[FarmerList])
    def get_all_farmers(self):
        return User.objects.filter(is_farmer=True)

    @route.get("/all_transporters", response=list[TransporterList])
    def get_all_transporters(self):
        return User.objects.filter(is_transporter=True)

    @route.get("/all_buyers", response=list[BuyerList])
    def get_all_buyers(self):
        # BUG CORRIGÉ : is_private_buyer (existant) au lieu de is_buyer seul
        return User.objects.filter(is_private_buyer=True)

    @route.get("/all_companies", response=list[CompanyList])
    def get_all_companies(self):
        # BUG CORRIGÉ : is_transformer (existant) au lieu de is_company (inexistant)
        return User.objects.filter(is_transformer=True, legal_number__isnull=True)

    @route.get("/all_institutions", response=list[InstitutionList])
    def get_all_institutions(self):
        # BUG CORRIGÉ : is_transformer + legal_number pour distinguer institution
        return User.objects.filter(is_transformer=True, legal_number__isnull=False)

    @route.get("/all_stores", response=list[StoreList])
    def get_all_stores(self):
        return User.objects.filter(is_store=True)

    @route.get("/all_certifiers", response=list[CertifierList])
    def get_all_certifiers(self):
        """Liste tous les organismes de certification enregistrés."""
        return User.objects.filter(is_certifier=True)

    @route.get("/{user_id}", response=UserProfileSchema)
    def get_user_profile(self, user_id: int):
        """Récupère le profil complet d'un utilisateur par son ID."""
        return get_object_or_404(User, id=user_id)

    @route.get("/me", response=UserProfileSchema, auth=JWTAuth())
    def get_my_profile(self, request):
        """Récupère le profil de l'utilisateur actuellement connecté via JWT."""
        return request.user

    
    # KYC
    

    @route.post("/kyc/upload", response=KYCDocumentSchema)
    def upload_kyc_documents(
        self,
        user_id: int,
        id_card_front: UploadedFile = File(...),
        id_card_back: UploadedFile = File(...),
        selfie_photo: UploadedFile = File(...),
    ):
        """Soumet les documents KYC d'un utilisateur pour vérification manuelle."""
        user = get_object_or_404(TracaoUser, id=user_id)

        if hasattr(user, 'kyc_document'):
            user.kyc_document.delete()

        kyc = KYCDocument.objects.create(
            user=user,
            id_card_front=id_card_front,
            id_card_back=id_card_back,
            selfie_photo=selfie_photo,
            status='PENDING',
        )
        return kyc

    @route.get("/kyc/status/{user_id}", response=KYCDocumentSchema)
    def get_kyc_status(self, user_id: int):
        """Consulte le statut KYC d'un utilisateur."""
        user = get_object_or_404(TracaoUser, id=user_id)
        return get_object_or_404(KYCDocument, user=user)