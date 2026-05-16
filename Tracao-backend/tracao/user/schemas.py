import pydantic
from ninja import ModelSchema,Schema
from user.models import TracaoUser, KYCDocument, Notification
from pydantic import Field

class VerifyOTPSchema(Schema):
    email: str
    code: str

class SetPasswordMagicLinkSchema(Schema):
    token: str
    new_password: str = Field(min_length=3)
    confirm_password: str = Field(min_length=3)


class FarmerBuyerRegister(Schema):
    first_name:str
    last_name:str
    city:str

    email:str
    phone_number:str
    password:str = Field(min_length=3)
    confirm_password:str = Field(min_length=3)


class CompanyRegister(Schema):
    person_to_call:str
    ptc_number:str
    
    org_name:str 
    record_number:str
    tax_number:str
    address:str
    country:str
    
    email:str
    phone_number:str
    password:str = Field(min_length=3)
    confirm_password:str = Field(min_length=3)

class InstitutionRegister(Schema):
    person_to_call:str
    ptc_number:str
    
    org_name:str 
    legal_number:str
    address:str
    country:str

    website:str
    
    email:str
    phone_number:str
    password:str = Field(min_length=3)
    confirm_password:str = Field(min_length=3)

class StoreRegister(Schema):
    person_to_call:str
    ptc_number:str

    store_name:str
    store_address:str
    address:str
    country:str
    
    email:str
    phone_number:str
    password:str = Field(min_length=3)
    confirm_password:str = Field(min_length=3)

class CreateTransporter(Schema):
    first_name: str
    last_name: str

    country: str
    address: str

    email: str
    phone_number: str
    # hired_by_id est passé dans l'URL, pas dans le body
    # password et confirm_password sont retirés (le transporter les définit via le magic link)

class FarmerList(ModelSchema):
    class Meta:
        model = TracaoUser
        fields = ['id', 'first_name', 'last_name', 'email', 'phone_number', 'country', 'situation_geo']

class BuyerList(ModelSchema):
    class Meta:
        model = TracaoUser
        fields = ['id', 'first_name', 'last_name', 'email', 'phone_number', 'country', 'situation_geo']

class TransporterList(ModelSchema):
    class Meta:
        model = TracaoUser
        # hired_by est le FK — Django Ninja expose automatiquement hired_by_id en JSON
        fields = ['id', 'first_name', 'last_name', 'email', 'phone_number', 'country', 'hired_by']

class CompanyList(ModelSchema):
    class Meta:
        model = TracaoUser
        fields = ['id', 'org_name', 'email', 'country', 'address']

class InstitutionList(ModelSchema):
    class Meta:
        model = TracaoUser
        fields = ['id', 'org_name', 'email', 'country', 'address']

class StoreList(ModelSchema):
    class Meta:
        model = TracaoUser
        fields = ['id', 'store_name', 'email', 'country', 'store_address']



class KYCDocumentSchema(ModelSchema):
    class Meta:
        model = KYCDocument
        fields = ['id', 'status', 'submitted_at', 'reviewed_at', 'rejection_reason']

class UserSchema(ModelSchema):
    class Meta:
        model = TracaoUser
        fields = [
            'id', 'email', 'first_name', 'last_name', 'phone_number', 
            'is_farmer', 'is_buyer', 'is_transformer', 'is_private_buyer', 
            'is_store', 'is_transporter', 'is_verified', 'city', 'country',
            'org_name', 'person_to_call', 'ptc_number', 'record_number',
            'tax_number', 'legal_number', 'website', 'store_name', 'store_address'
        ]

class NotificationSchema(ModelSchema):
    class Meta:
        model = Notification
        fields = ['id', 'type', 'message', 'is_read', 'created_at', 'metadata']