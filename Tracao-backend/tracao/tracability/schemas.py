from ninja import ModelSchema, Schema
from typing import List, Optional
from datetime import datetime
from tracability.models import TraceabilityEvent, BatchCertification



# SCHEMAS DE LECTURE


class TraceabilityEventSchema(ModelSchema):
    actor_email: Optional[str] = None

    class Meta:
        model = TraceabilityEvent
        fields = ['id', 'event_type', 'location_name', 'gps_lat', 'gps_lng',
                  'blockchain_tx_hash', 'notes', 'timestamp']

    @staticmethod
    def resolve_actor_email(obj):
        return obj.actor.email if obj.actor else None


class BatchCertificationSchema(ModelSchema):
    certifier_email: Optional[str] = None
    certifier_org: Optional[str] = None

    class Meta:
        model = BatchCertification
        fields = ['id', 'certification_type', 'certification_name', 'issued_at',
                  'expires_at', 'notes']

    @staticmethod
    def resolve_certifier_email(obj):
        return obj.certifier.email if obj.certifier else None

    @staticmethod
    def resolve_certifier_org(obj):
        return obj.certifier.org_name if obj.certifier else None


class FarmerSummarySchema(Schema):
    """Résumé du producteur exposé dans le QR Code — données EUDR."""
    id: int
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    situation_geo: Optional[str] = None
    country: Optional[str] = None
    cooperative_name: Optional[str] = None


class ParcelSummarySchema(Schema):
    """Résumé de la parcelle avec coordonnées GPS — exigence EUDR."""
    id: str
    name: str
    gps_coordinates: Optional[list] = None
    area: Optional[float] = None


class QRCodeBatchSchema(Schema):
    """
    Données retournées lors du scan d'un QR code de lot.
    Conçu pour être lisible par n'importe quel acteur : agriculteur,
    coopérative, exportateur, importateur européen, organisme EUDR.
    """
    # Identifiants du lot
    batch_id: str
    unique_code: str
    crop_type: str
    season: str
    estimated_quantity: float
    actual_quantity: Optional[float] = None
    status: str
    created_at: datetime

    # Producteur (EUDR : qui a produit ?)
    farmer: FarmerSummarySchema

    # Parcelle (EUDR : où a été produit ?)
    parcel: Optional[ParcelSummarySchema] = None

    # Historique de traçabilité
    events: List[TraceabilityEventSchema] = []

    # Certifications (Fairtrade, Bio EU…)
    certifications: List[BatchCertificationSchema] = []

    # Vérification blockchain
    blockchain_verified: bool = False
    blockchain_data: Optional[dict] = None


class BatchJourneySchema(Schema):
    """Historique complet d'un lot pour les auditeurs et l'EUDR."""
    unique_code: str
    crop_type: str
    farmer_email: str
    parcel_name: Optional[str] = None
    events: List[TraceabilityEventSchema]
    certifications: List[BatchCertificationSchema]
    blockchain_verified: bool = False



# SCHEMAS D'ÉCRITURE


class CertifyBatchRequest(Schema):
    unique_code: str
    certifier_id: int
    certification_type: str = 'custom'
    certification_name: str
    notes: Optional[str] = None
