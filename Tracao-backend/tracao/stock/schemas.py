from ninja import Schema, ModelSchema
from typing import List, Dict, Any, Optional
from datetime import date, datetime
from stock.models import Parcel, Batch, Harvest, BatchTransfer
import uuid as uuid_module



# PARCEL Schemas


class ParcelCreateSchema(Schema):
    """Création d'une parcelle agricole — données GPS obligatoires (EUDR)."""
    name: str
    farmer_id: int
    # Polygone GPS : [{lat: float, lng: float}, ...]  minimum 3 points
    gps_coordinates: List[Dict[str, Any]]
    area: Optional[float] = None

class ParcelUpdateSchema(Schema):
    name: Optional[str] = None
    gps_coordinates: Optional[List[Dict[str, Any]]] = None
    area: Optional[float] = None
    status: Optional[str] = None

class ParcelResponseSchema(ModelSchema):
    farmer_email: Optional[str] = None
    farmer_name: Optional[str] = None

    class Meta:
        model = Parcel
        fields = ['id', 'name', 'gps_coordinates', 'area', 'status', 'created_at', 'updated_at']

    @staticmethod
    def resolve_farmer_email(obj):
        return obj.farmer.email if obj.farmer else None

    @staticmethod
    def resolve_farmer_name(obj):
        if obj.farmer:
            return f"{obj.farmer.first_name or ''} {obj.farmer.last_name or ''}".strip()
        return None



# BATCH Schemas


class BatchCreateSchema(Schema):
    """
    Création d'un lot de récolte.
    Le unique_code est généré automatiquement si non fourni.
    """
    farmer_id: int
    parcel_id: str  # UUID de la parcelle
    season: str
    crop_type: str  # 'cacao' ou 'cafe'
    estimated_quantity: float
    unique_code: Optional[str] = None  # Auto-généré si absent : TRC-YYYY-XXXX

class BatchUpdateSchema(Schema):
    actual_quantity: Optional[float] = None
    status: Optional[str] = None
    estimated_quantity: Optional[float] = None

class BatchResponseSchema(ModelSchema):
    farmer_email: Optional[str] = None
    farmer_name: Optional[str] = None
    parcel_name: Optional[str] = None
    blockchain_verified: bool = False

    class Meta:
        model = Batch
        fields = ['id', 'unique_code', 'crop_type', 'season',
                  'estimated_quantity', 'actual_quantity', 'status',
                  'blockchain_tx_hash', 'created_at', 'updated_at']

    @staticmethod
    def resolve_farmer_email(obj):
        return obj.farmer.email if obj.farmer else None

    @staticmethod
    def resolve_farmer_name(obj):
        if obj.farmer:
            return f"{obj.farmer.first_name or ''} {obj.farmer.last_name or ''}".strip()
        return None

    @staticmethod
    def resolve_parcel_name(obj):
        return obj.parcel.name if obj.parcel else None

    @staticmethod
    def resolve_blockchain_verified(obj):
        return obj.blockchain_tx_hash is not None



# HARVEST Schemas


class HarvestCreateSchema(Schema):
    batch_id: str   # UUID du lot
    farmer_id: int
    quantity: float
    harvest_date: date
    notes: Optional[str] = None

class HarvestResponseSchema(ModelSchema):
    batch_code: Optional[str] = None

    class Meta:
        model = Harvest
        fields = ['id', 'quantity', 'harvest_date', 'notes', 'created_at']

    @staticmethod
    def resolve_batch_code(obj):
        return obj.batch.unique_code if obj.batch else None



# BATCH TRANSFER Schemas


class BatchTransferCreateSchema(Schema):
    """
    Enregistre un transfert physique d'un lot entre deux acteurs.
    Déclenche automatiquement un log blockchain via signal.
    """
    batch_id: str       # UUID du lot
    sender_id: int      # ID Django de l'expéditeur
    receiver_id: int    # ID Django du destinataire
    transfer_type: str  # 'FARM_TO_COOP', 'COOP_TO_TRANSPORTER', etc.
    quantity: float
    price_per_kg: Optional[float] = None
    location: Optional[str] = None
    notes: Optional[str] = None

class BatchTransferResponseSchema(ModelSchema):
    sender_email: Optional[str] = None
    receiver_email: Optional[str] = None
    batch_code: Optional[str] = None
    blockchain_verified: bool = False

    class Meta:
        model = BatchTransfer
        fields = ['id', 'transfer_type', 'quantity', 'price_per_kg',
                  'status', 'location', 'blockchain_tx_hash', 'notes',
                  'created_at', 'confirmed_at']

    @staticmethod
    def resolve_sender_email(obj):
        return obj.sender.email if obj.sender else None

    @staticmethod
    def resolve_receiver_email(obj):
        return obj.receiver.email if obj.receiver else None

    @staticmethod
    def resolve_batch_code(obj):
        return obj.batch.unique_code if obj.batch else None

    @staticmethod
    def resolve_blockchain_verified(obj):
        return obj.blockchain_tx_hash is not None
