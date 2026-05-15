"""
API Stock — ChainCacao
CRUD complet pour : Parcelles, Lots, Récoltes, Transferts
"""
from ninja_extra import api_controller, route
from ninja.errors import HttpError
from stock.schemas import (
    ParcelCreateSchema, ParcelUpdateSchema, ParcelResponseSchema,
    BatchCreateSchema, BatchUpdateSchema, BatchResponseSchema,
    HarvestCreateSchema, HarvestResponseSchema,
    BatchTransferCreateSchema, BatchTransferResponseSchema,
)
from stock.models import Parcel, Batch, Harvest, BatchTransfer
from user.models import TracaoUser
from django.shortcuts import get_object_or_404
from datetime import datetime
import uuid


def _generate_unique_code(crop_type: str) -> str:
    """Génère un code unique au format TRC-ANNÉE-XXXX."""
    year = datetime.now().year
    suffix = uuid.uuid4().hex[:6].upper()
    prefix = "CAC" if crop_type == "cacao" else "CAF"
    return f"TRC-{prefix}-{year}-{suffix}"


@api_controller('/stock', auth=None)
class StockController:

    
    # PARCELLES
    

    @route.post('/parcels', response=ParcelResponseSchema)
    def create_parcel(self, data: ParcelCreateSchema):
        """
        Enregistre une nouvelle parcelle agricole avec ses coordonnées GPS.
        Les coordonnées GPS sont obligatoires pour la conformité EUDR.
        Minimum 3 points de polygone requis.
        """
        if len(data.gps_coordinates) < 3:
            raise HttpError(400, "Le polygone GPS doit contenir au moins 3 points (exigence EUDR).")

        farmer = get_object_or_404(TracaoUser, id=data.farmer_id, is_farmer=True)
        parcel = Parcel.objects.create(
            farmer=farmer,
            name=data.name,
            gps_coordinates=data.gps_coordinates,
            area=data.area,
        )
        return parcel

    @route.get('/parcels', response=list[ParcelResponseSchema])
    def get_all_parcels(self):
        """Liste toutes les parcelles enregistrées."""
        return Parcel.objects.select_related('farmer').all()

    @route.get('/parcels/{parcel_id}', response=ParcelResponseSchema)
    def get_parcel(self, parcel_id: str):
        """Détails d'une parcelle par son UUID."""
        return get_object_or_404(Parcel.objects.select_related('farmer'), id=parcel_id)

    @route.get('/parcels/farmer/{farmer_id}', response=list[ParcelResponseSchema])
    def get_farmer_parcels(self, farmer_id: int):
        """Toutes les parcelles d'un agriculteur donné."""
        get_object_or_404(TracaoUser, id=farmer_id, is_farmer=True)
        return Parcel.objects.filter(farmer_id=farmer_id).select_related('farmer')

    @route.patch('/parcels/{parcel_id}', response=ParcelResponseSchema)
    def update_parcel(self, parcel_id: str, data: ParcelUpdateSchema):
        """Met à jour une parcelle (coordonnées, superficie, statut)."""
        parcel = get_object_or_404(Parcel, id=parcel_id)
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(parcel, field, value)
        parcel.save()
        return parcel

    @route.post('/parcels/{parcel_id}/validate', response=ParcelResponseSchema)
    def validate_parcel(self, parcel_id: str, store_id: int):
        """
        Permet à un magasin/coopérative (is_store=True) de valider une parcelle.
        La validation est nécessaire avant d'enregistrer un lot.
        """
        parcel = get_object_or_404(Parcel, id=parcel_id)
        store = get_object_or_404(TracaoUser, id=store_id, is_store=True)
        parcel.status = 'approved'
        parcel.validated_by = store
        parcel.save()
        return parcel

    
    # LOTS (BATCHES)
    

    @route.post('/batches', response=BatchResponseSchema)
    def create_batch(self, data: BatchCreateSchema):
        """
        Enregistre un nouveau lot de récolte.
        Déclenche automatiquement l'inscription sur la blockchain via signal.
        Le unique_code est généré automatiquement si non fourni.
        """
        farmer = get_object_or_404(TracaoUser, id=data.farmer_id, is_farmer=True)
        parcel = get_object_or_404(Parcel, id=data.parcel_id)

        if parcel.farmer_id != farmer.id:
            raise HttpError(403, "Cette parcelle n'appartient pas à cet agriculteur.")

        # Générer un unique_code si non fourni
        unique_code = data.unique_code or _generate_unique_code(data.crop_type)

        # Vérifier l'unicité
        if Batch.objects.filter(unique_code=unique_code).exists():
            raise HttpError(409, f"Le code '{unique_code}' est déjà utilisé.")

        batch = Batch.objects.create(
            farmer=farmer,
            parcel=parcel,
            season=data.season,
            crop_type=data.crop_type,
            estimated_quantity=data.estimated_quantity,
            unique_code=unique_code,
        )
        # Le signal post_save déclenche automatiquement l'inscription blockchain
        return batch

    @route.get('/batches', response=list[BatchResponseSchema])
    def get_all_batches(self):
        """Liste tous les lots."""
        return Batch.objects.select_related('farmer', 'parcel').all()

    @route.get('/batches/{batch_id}', response=BatchResponseSchema)
    def get_batch(self, batch_id: str):
        """Détails d'un lot par son UUID."""
        return get_object_or_404(
            Batch.objects.select_related('farmer', 'parcel'), id=batch_id
        )

    @route.get('/batches/by-code/{unique_code}', response=BatchResponseSchema)
    def get_batch_by_code(self, unique_code: str):
        """
        Récupère un lot par son code unique (TRC-XXX-YYYY-ZZZZZZ).
        Utilisé pour les recherches manuelles et la liaison QR code.
        """
        return get_object_or_404(
            Batch.objects.select_related('farmer', 'parcel'), unique_code=unique_code
        )

    @route.get('/batches/farmer/{farmer_id}', response=list[BatchResponseSchema])
    def get_farmer_batches(self, farmer_id: int):
        """Tous les lots d'un agriculteur."""
        get_object_or_404(TracaoUser, id=farmer_id, is_farmer=True)
        return Batch.objects.filter(farmer_id=farmer_id).select_related('farmer', 'parcel')

    @route.patch('/batches/{batch_id}', response=BatchResponseSchema)
    def update_batch(self, batch_id: str, data: BatchUpdateSchema):
        """Met à jour un lot (quantité réelle, statut)."""
        batch = get_object_or_404(Batch, id=batch_id)
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(batch, field, value)
        batch.save()
        return batch

    
    # RÉCOLTES (HARVESTS)
    

    @route.post('/harvests', response=HarvestResponseSchema)
    def create_harvest(self, data: HarvestCreateSchema):
        """
        Enregistre une entrée de récolte (pesée du jour).
        Plusieurs récoltes peuvent être liées au même lot.
        """
        batch = get_object_or_404(Batch, id=data.batch_id)
        farmer = get_object_or_404(TracaoUser, id=data.farmer_id, is_farmer=True)

        harvest = Harvest.objects.create(
            batch=batch,
            farmer=farmer,
            quantity=data.quantity,
            harvest_date=data.harvest_date,
            notes=data.notes,
        )
        return harvest

    @route.get('/harvests/batch/{batch_id}', response=list[HarvestResponseSchema])
    def get_batch_harvests(self, batch_id: str):
        """Toutes les entrées de récolte pour un lot."""
        get_object_or_404(Batch, id=batch_id)
        return Harvest.objects.filter(batch_id=batch_id).select_related('batch')

    
    # TRANSFERTS (BATCH TRANSFERS)
    

    @route.post('/transfers', response=BatchTransferResponseSchema)
    def create_transfer(self, data: BatchTransferCreateSchema):
        """
        Enregistre un transfert physique d'un lot entre deux acteurs.
        Déclenche automatiquement un log blockchain via signal Django.

        Types supportés :
        - FARM_TO_COOP : Ferme → Coopérative
        - COOP_TO_TRANSPORTER : Coopérative → Transporteur
        - TRANSPORTER_TO_EXPORTER : Transporteur → Exportateur
        - EXPORTER_TO_EU_IMPORTER : Exportateur → Importateur EU
        """
        batch = get_object_or_404(Batch, id=data.batch_id)
        sender = get_object_or_404(TracaoUser, id=data.sender_id)
        receiver = get_object_or_404(TracaoUser, id=data.receiver_id)

        transfer = BatchTransfer.objects.create(
            batch=batch,
            sender=sender,
            receiver=receiver,
            transfer_type=data.transfer_type,
            quantity=data.quantity,
            price_per_kg=data.price_per_kg,
            location=data.location,
            notes=data.notes,
        )
        # Le signal post_save déclenche le log blockchain automatiquement
        return transfer

    @route.get('/transfers/batch/{batch_id}', response=list[BatchTransferResponseSchema])
    def get_batch_transfers(self, batch_id: str):
        """Tous les transferts d'un lot (historique logistique off-chain)."""
        get_object_or_404(Batch, id=batch_id)
        return BatchTransfer.objects.filter(batch_id=batch_id).select_related('sender', 'receiver', 'batch')

    @route.patch('/transfers/{transfer_id}/confirm', response=BatchTransferResponseSchema)
    def confirm_transfer(self, transfer_id: str):
        """
        Confirme un transfert (le destinataire confirme la réception).
        Met à jour le statut du lot en conséquence.
        """
        from django.utils import timezone
        transfer = get_object_or_404(BatchTransfer, id=transfer_id)
        if transfer.status == 'confirmed':
            raise HttpError(409, "Ce transfert est déjà confirmé.")
        transfer.status = 'confirmed'
        transfer.confirmed_at = timezone.now()
        transfer.save()

        # Mettre à jour le statut du lot
        batch = transfer.batch
        status_map = {
            'FARM_TO_COOP':             'pending',
            'COOP_TO_TRANSPORTER':      'in_transit',
            'TRANSPORTER_TO_EXPORTER':  'delivered',
            'EXPORTER_TO_EU_IMPORTER':  'exported',
        }
        new_status = status_map.get(transfer.transfer_type)
        if new_status:
            batch.status = new_status
            batch.save()

        return transfer