import pydantic
from ninja import ModelSchema, Schema
from user.models import TracaoUser, KYCDocument, Notification
from pydantic import Field
from typing import Optional



# SCHEMAS D'AUTHENTIFICATION


class VerifyOTPSchema(Schema):
    email: str
    code: str


class SetPasswordMagicLinkSchema(Schema):
    token: str
    new_password: str = Field(min_length=3)
    confirm_password: str = Field(min_length=3)


class GoogleLoginSchema(Schema):
    credential: str



# SCHEMAS D'INSCRIPTION


class FarmerBuyerRegister(Schema):
    """Inscription d'un agriculteur ou acheteur individuel."""
    first_name: str
    last_name: str
    situation_geo: Optional[str] = "Lome"

    email: str
    phone_number: str
    cooperative_name: Optional[str] = None
    password: str = Field(min_length=3)
    confirm_password: str = Field(min_length=3)


class CompanyRegister(Schema):
    """Inscription d'une entreprise locale de transformation."""
    person_to_call: str
    ptc_number: str

    org_name: str
    record_number: Optional[str] = None
    tax_number: Optional[str] = None
    address: str
    country: str

    email: str
    phone_number: str
    password: str = Field(min_length=3)
    confirm_password: str = Field(min_length=3)


class InstitutionRegister(Schema):
    """Inscription d'une institution (Ministère, ONG, etc.) avec numéro légal."""
    person_to_call: str
    ptc_number: str

    org_name: str
    legal_number: Optional[str] = None
    address: str
    country: str
    website: Optional[str] = None

    email: str
    phone_number: str
    password: str = Field(min_length=3)
    confirm_password: str = Field(min_length=3)


class StoreRegister(Schema):
    """Inscription d'un magasin ou coopérative agricole locale."""
    person_to_call: str
    ptc_number: str

    store_name: str
    store_address: str
    address: str
    country: str

    email: str
    phone_number: str
    password: str = Field(min_length=3)
    confirm_password: str = Field(min_length=3)


class CertifierRegister(Schema):
    """Inscription d'un organisme de certification (Fairtrade, Bio EU, Rainforest Alliance, etc.)."""
    person_to_call: str
    ptc_number: str

    org_name: str
    address: str
    country: str
    website: Optional[str] = None

    email: str
    phone_number: str
    password: str = Field(min_length=3)
    confirm_password: str = Field(min_length=3)


class CreateTransporter(Schema):
    """Inscription d'un transporteur lié à une entité employeuse."""
    first_name: str
    last_name: str
    country: str
    address: str
    email: str
    phone_number: str
    # hired_by_id est passé dans l'URL, pas dans le body
    # Le mot de passe est défini par le transporteur via le magic link



# SCHEMAS DE RÉPONSE (LISTES)
# NOTE: phone_number et country sont des objets complexes (PhoneNumber, Country).
# On les redéclare en Optional[str] + resolve_* pour forcer la sérialisation.


class FarmerList(ModelSchema):
    phone_number: Optional[str] = None
    country: Optional[str] = None

    class Meta:
        model = TracaoUser
        fields = ['id', 'first_name', 'last_name', 'email', 'phone_number',
                  'country', 'situation_geo', 'cooperative_name', 'is_verified']

    @staticmethod
    def resolve_phone_number(obj):
        return str(obj.phone_number) if getattr(obj, 'phone_number', None) else None

    @staticmethod
    def resolve_country(obj):
        return str(obj.country) if getattr(obj, 'country', None) else None


class BuyerList(ModelSchema):
    phone_number: Optional[str] = None
    country: Optional[str] = None

    class Meta:
        model = TracaoUser
        fields = ['id', 'first_name', 'last_name', 'email', 'phone_number',
                  'country', 'situation_geo', 'is_verified']

    @staticmethod
    def resolve_phone_number(obj):
        return str(obj.phone_number) if getattr(obj, 'phone_number', None) else None

    @staticmethod
    def resolve_country(obj):
        return str(obj.country) if getattr(obj, 'country', None) else None


class TransporterList(ModelSchema):
    phone_number: Optional[str] = None
    country: Optional[str] = None

    class Meta:
        model = TracaoUser
        fields = ['id', 'first_name', 'last_name', 'email', 'phone_number',
                  'country', 'hired_by', 'is_verified']

    @staticmethod
    def resolve_phone_number(obj):
        return str(obj.phone_number) if getattr(obj, 'phone_number', None) else None

    @staticmethod
    def resolve_country(obj):
        return str(obj.country) if getattr(obj, 'country', None) else None


class CompanyList(ModelSchema):
    country: Optional[str] = None

    class Meta:
        model = TracaoUser
        fields = ['id', 'org_name', 'email', 'country', 'address',
                  'tax_number', 'record_number', 'is_verified']

    @staticmethod
    def resolve_country(obj):
        return str(obj.country) if getattr(obj, 'country', None) else None


class InstitutionList(ModelSchema):
    country: Optional[str] = None

    class Meta:
        model = TracaoUser
        fields = ['id', 'org_name', 'email', 'country', 'address',
                  'legal_number', 'website', 'is_verified']

    @staticmethod
    def resolve_country(obj):
        return str(obj.country) if getattr(obj, 'country', None) else None


class StoreList(ModelSchema):
    country: Optional[str] = None

    class Meta:
        model = TracaoUser
        fields = ['id', 'store_name', 'email', 'country', 'store_address', 'is_verified']

    @staticmethod
    def resolve_country(obj):
        return str(obj.country) if getattr(obj, 'country', None) else None


class CertifierList(ModelSchema):
    """Organisme de certification — exposé dans les réponses de lot certifié."""
    country: Optional[str] = None

    class Meta:
        model = TracaoUser
        fields = ['id', 'org_name', 'email', 'country', 'address', 'website', 'is_verified']

    @staticmethod
    def resolve_country(obj):
        return str(obj.country) if getattr(obj, 'country', None) else None


class UserProfileSchema(ModelSchema):
    """Profil complet d'un utilisateur — tous les rôles et données."""
    phone_number: Optional[str] = None
    country: Optional[str] = None

    class Meta:
        model = TracaoUser
        fields = [
            'id', 'email', 'phone_number', 'country', 'situation_geo',
            'first_name', 'last_name', 'cooperative_name',
            'org_name', 'address', 'store_name', 'store_address',
            'legal_number', 'website', 'tax_number', 'record_number',
            'is_farmer', 'is_buyer', 'is_private_buyer', 'is_transformer',
            'is_store', 'is_transporter', 'is_certifier',
            'is_verified', 'is_active',
            'created_at',
        ]

    @staticmethod
    def resolve_phone_number(obj):
        return str(obj.phone_number) if getattr(obj, 'phone_number', None) else None

    @staticmethod
    def resolve_country(obj):
        return str(obj.country) if getattr(obj, 'country', None) else None



# KYC


class KYCDocumentSchema(ModelSchema):
    class Meta:
        model = KYCDocument
        fields = ['id', 'status', 'submitted_at', 'reviewed_at', 'rejection_reason']


class UserSchema(ModelSchema):
    phone_number: Optional[str] = None
    country: Optional[str] = None

    class Meta:
        model = TracaoUser
        fields = [
            'id', 'email', 'first_name', 'last_name', 'phone_number',
            'is_farmer', 'is_buyer', 'is_transformer', 'is_private_buyer',
            'is_store', 'is_transporter', 'is_verified', 'situation_geo', 'country',
            'org_name', 'person_to_call', 'ptc_number', 'record_number',
            'tax_number', 'legal_number', 'website', 'store_name', 'store_address'
        ]

    @staticmethod
    def resolve_phone_number(obj):
        return str(obj.phone_number) if getattr(obj, 'phone_number', None) else None

    @staticmethod
    def resolve_country(obj):
        return str(obj.country) if getattr(obj, 'country', None) else None


class NotificationSchema(ModelSchema):
    class Meta:
        model = Notification
        fields = ['id', 'type', 'message', 'is_read', 'created_at', 'metadata']