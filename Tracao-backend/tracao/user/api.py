from ninja_extra import api_controller, route
from ninja_extra.permissions import IsAuthenticated, AllowAny, IsAdminUser
from ninja import File, Form
from ninja.files import UploadedFile
from user.schemas import (
    FarmerBuyerRegister, CompanyRegister, InstitutionRegister, StoreRegister,
    CreateTransporter, CertifierRegister,
    KYCDocumentSchema, FarmerList, BuyerList, CompanyList, InstitutionList,
    StoreList, TransporterList, CertifierList,
    VerifyOTPSchema, SetPasswordMagicLinkSchema, UserProfileSchema,
)
from user.models import TracaoUser, KYCDocument, OTP, MagicLink
from user.utils import send_otp_email, send_magic_link_email
from django.shortcuts import get_object_or_404
from typing import Optional
from ninja.errors import HttpError

User = TracaoUser


@api_controller('/users', auth=None)
class UserController:

    
    # INSCRIPTIONS
    

    @route.post("/farmer_signup", response=FarmerList)
    def register_farmer(self, user: FarmerBuyerRegister):
        """Inscription d'un agriculteur. Envoie un OTP de vérification par email."""
        user_data = user.model_dump()
        email = user_data.get('email')
        password = user_data.pop('password')
        user_data.pop('confirm_password')

        user_model, created = User.objects.get_or_create(
            email=email,
            defaults={**user_data, 'is_farmer': True, 'is_verified': False}
        )
        if created:
            user_model.set_password(password)
            user_model.save()
            send_otp_email(user_model)
        return user_model

    @route.post("/buyer_signup", response=BuyerList)
    def register_buyer(self, user: FarmerBuyerRegister):
        """Inscription d'un acheteur individuel. Envoie un OTP de vérification."""
        user_data = user.model_dump()
        email = user_data.get('email')
        password = user_data.pop('password')
        user_data.pop('confirm_password')

        user_model, created = User.objects.get_or_create(
            email=email,
            defaults={**user_data, 'is_private_buyer': True, 'is_buyer': True, 'is_verified': False}
        )
        if created:
            user_model.set_password(password)
            user_model.save()
            send_otp_email(user_model)
        return user_model

    @route.post("/company_signup", response=CompanyList)
    def register_company(
        self,
        data: CompanyRegister = Form(...),
        certification: UploadedFile = File(None),
    ):
        """Inscription d'une entreprise locale de transformation."""
        user_data = data.model_dump()
        password = user_data.pop('password')
        user_data.pop('confirm_password')

        user = User.objects.create(**user_data, is_transformer=True, is_buyer=True, is_verified=False)
        user.set_password(password)

        if certification:
            user.certification = certification

        user.save()
        send_otp_email(user)
        return user

    @route.post("/institution_signup", response=InstitutionList)
    def register_institution(
        self,
        data: InstitutionRegister = Form(...),
        certification: UploadedFile = File(None),
    ):
        """
        Inscription d'une institution (Ministère Agriculture, ONG, etc.).
        Les institutions sont des transformateurs avec numéro légal.
        """
        user_data = data.model_dump()
        password = user_data.pop('password')
        user_data.pop('confirm_password')

        user = User.objects.create(**user_data, is_transformer=True, is_buyer=True, is_verified=False)
        user.set_password(password)

        if certification:
            user.certification = certification

        user.save()
        send_otp_email(user)
        return user

    @route.post("/store_signup", response=StoreList)
    def register_store(
        self,
        data: StoreRegister = Form(...),
        certification: UploadedFile = File(None),
    ):
        """
        Inscription d'un magasin / coopérative locale.
        Les stores peuvent valider des parcelles et des lots.
        """
        user_data = data.model_dump()
        password = user_data.pop('password')
        user_data.pop('confirm_password')

        user = User.objects.create(**user_data, is_store=True, is_verified=False)
        user.set_password(password)

        if certification:
            user.certification = certification

        user.save()
        send_otp_email(user)
        return user

    @route.post("/certifier_signup", response=CertifierList)
    def register_certifier(
        self,
        data: CertifierRegister,
        certification: UploadedFile = File(None),
    ):
        """
        Inscription d'un organisme de certification (Fairtrade, Bio EU, Rainforest Alliance, etc.).
        Ces organismes sont les seuls à pouvoir certifier des lots.
        """
        user_data = data.model_dump()
        password = user_data.pop('password')
        user_data.pop('confirm_password')

        user = User.objects.create(**user_data, is_certifier=True, is_verified=False)
        user.set_password(password)

        if certification:
            user.certification = certification

        user.save()
        send_otp_email(user)
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

        return {"message": "✅ Email vérifié avec succès. Vous pouvez maintenant vous connecter."}

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