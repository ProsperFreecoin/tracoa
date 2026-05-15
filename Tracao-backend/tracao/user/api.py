from ninja_extra import api_controller,route
from ninja_extra.permissions import IsAuthenticated,AllowAny,IsAdminUser
from ninja import File, Form
from ninja.files import UploadedFile
from user.schemas import (
    FarmerBuyerRegister, CompanyRegister, InstitutionRegister, StoreRegister, CreateTransporter,
    KYCDocumentSchema, FarmerList, BuyerList, CompanyList, InstitutionList, StoreList, TransporterList,
    VerifyOTPSchema, SetPasswordMagicLinkSchema
)
from user.models import TracaoUser, KYCDocument, OTP, MagicLink
from user.utils import send_otp_email, send_magic_link_email
from django.shortcuts import get_object_or_404
from typing import Optional
from ninja.errors import HttpError

User = TracaoUser

@api_controller('/users',auth=None)
class UserController:
    @route.post("/farmer_signup",response = FarmerList)
    def register_farmer(self,user:FarmerBuyerRegister):
        user_data = user.model_dump()
        email = user_data.get('email')
        password = user_data.pop('password')
        user_data.pop('confirm_password')
        
        user_model, created = User.objects.get_or_create(email=email, defaults={**user_data, 'is_farmer': True, 'is_verified': False})
        if created:
            user_model.set_password(password)
            user_model.save()
            send_otp_email(user_model)
        return user_model
        
    @route.post("/buyer_signup",response = BuyerList)
    def register_buyer(self,user:FarmerBuyerRegister):
        user_data = user.model_dump()
        email = user_data.get('email')
        password = user_data.pop('password')
        user_data.pop('confirm_password')
        
        user_model, created = User.objects.get_or_create(email=email, defaults={**user_data, 'is_private_buyer': True, 'is_buyer': True, 'is_verified': False})
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
        user_data = data.model_dump()
        password = user_data.pop('password')
        user_data.pop('confirm_password')

        user = User.objects.create(**user_data, is_transformer=True, is_verified=False)
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
        user_data = data.model_dump()
        password = user_data.pop('password')
        user_data.pop('confirm_password')

        user = User.objects.create(**user_data, is_verified=False)
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

    @route.post("/verify-otp")
    def verify_otp(self, data: VerifyOTPSchema):
        user = get_object_or_404(User, email=data.email)
        
        # Trouver un OTP valide pour cet utilisateur
        otp = OTP.objects.filter(user=user, code=data.code, is_used=False).order_by('-created_at').first()
        
        if not otp or not otp.is_valid():
            raise HttpError(400, "Code invalide ou expiré.")
            
        # Valider l'OTP et l'utilisateur
        otp.is_used = True
        otp.save()
        
        user.is_verified = True
        user.save()
        
        return {"message": "Email vérifié avec succès."}

    # L'entité qui recrute (farmer, buyer, store, company, institution) est dans l'URL
    # Exemple : POST /users/store/42/transporter_signup
    @route.post("/{employer_type}/{employer_id}/transporter_signup", response=TransporterList)
    def register_transporter(self, employer_type: str, employer_id: int, data: CreateTransporter):
        from ninja.errors import HttpError

        # Types d'entités autorisés à recruter un transporter
        EMPLOYER_TYPE_MAP = {
            'farmer':      'is_farmer',
            'buyer':       'is_buyer',
            'store':       'is_store',
            'company':     'is_transformer',
            'institution': 'is_transformer',
        }

        # 1. Vérifier que le type dans l'URL est valide
        if employer_type not in EMPLOYER_TYPE_MAP:
            raise HttpError(
                400,
                f"Type d'entité invalide : '{employer_type}'. "
                f"Valeurs acceptées : {list(EMPLOYER_TYPE_MAP.keys())}"
            )

        # 2. Récupérer l'entité employeur et vérifier son rôle
        employer = get_object_or_404(User, id=employer_id)
        expected_flag = EMPLOYER_TYPE_MAP[employer_type]
        if not getattr(employer, expected_flag, False):
            raise HttpError(
                400,
                f"L'utilisateur #{employer_id} n'est pas un '{employer_type}'."
            )

        # 3. Préparer les données
        user_data = data.model_dump()
        
        # 4. Créer le transporter et le lier à l'employeur
        # On définit is_verified=False jusqu'à ce qu'il configure son compte via le lien magique
        transporter = User.objects.create(**user_data, is_transporter=True, hired_by=employer, is_verified=False)
        transporter.set_unusable_password() # Pas de mot de passe valide pour l'instant
        transporter.save()
        
        # 5. Envoyer le lien magique
        send_magic_link_email(transporter, employer)

        return transporter

    @route.post("/magic-link/set-password")
    def set_password_magic_link(self, data: SetPasswordMagicLinkSchema):
        if data.new_password != data.confirm_password:
            raise HttpError(400, "Les mots de passe ne correspondent pas.")
            
        magic_link = get_object_or_404(MagicLink, token_hash=data.token)
        
        if not magic_link.is_valid():
            raise HttpError(400, "Le lien magique est invalide ou a expiré.")
            
        user = magic_link.user
        user.set_password(data.new_password)
        user.is_verified = True  # Le lien magique valide aussi l'email implicitement
        user.save()
        
        magic_link.is_used = True
        magic_link.save()
        
        return {"message": "Mot de passe défini avec succès. Vous pouvez maintenant vous connecter."}


    @route.get("/all_farmers",response = list[FarmerList])
    def get_all_farmers(self):
        return User.objects.filter(is_farmer=True)

    @route.get("/all_transporters",response = list[TransporterList])
    def get_all_transporters(self):
        return User.objects.filter(is_transporter=True)

    @route.get("/all_buyers",response = list[BuyerList])
    def get_all_buyers(self):
        return User.objects.filter(is_private_buyer=True)

    @route.get("/all_companies",response = list[CompanyList])
    def get_all_companies(self):
        return User.objects.filter(is_company=True)

    @route.get("/all_institutions",response = list[InstitutionList])
    def get_all_institutions(self):
        return User.objects.filter(is_institution=True)

    @route.get("/all_stores",response = list[StoreList])
    def get_all_stores(self):
        return User.objects.filter(is_store=True)



    @route.post("/kyc/upload", response=KYCDocumentSchema)
    def upload_kyc_documents(
        self,
        user_id: int,
        id_card_front: UploadedFile = File(...),
        id_card_back: UploadedFile = File(...),
        selfie_photo: UploadedFile = File(...)
    ):
        """Permet à un utilisateur de soumettre ses documents KYC pour vérification."""
        user = get_object_or_404(TracaoUser, id=user_id)
        
        # Supprime l'ancien KYC s'il existait
        if hasattr(user, 'kyc_document'):
            user.kyc_document.delete()
            
        kyc = KYCDocument.objects.create(
            user=user,
            id_card_front=id_card_front,
            id_card_back=id_card_back,
            selfie_photo=selfie_photo,
            status='PENDING'
        )
        return kyc

    @route.get("/kyc/status/{user_id}", response=KYCDocumentSchema)
    def get_kyc_status(self, user_id: int):
        """Récupère le statut actuel du KYC de l'utilisateur."""
        user = get_object_or_404(TracaoUser, id=user_id)
        kyc = get_object_or_404(KYCDocument, user=user)
        return kyc