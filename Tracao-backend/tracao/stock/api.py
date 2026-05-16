from ninja_extra import api_controller, route
from ninja.responses import Response
from typing import List, Optional
from django.shortcuts import get_object_or_404
from ninja_jwt.authentication import JWTAuth
from stock.models import Parcel, Batch, Harvest, BatchTransfer
from stock.schemas import (
    ParcelCreateSchema, ParcelResponseSchema, ParcelUpdateSchema,
    BatchCreateSchema, BatchResponseSchema, BatchUpdateSchema,
    HarvestCreateSchema, HarvestResponseSchema,
    BatchTransferCreateSchema, BatchTransferResponseSchema
)
from user.models import TracaoUser
from ninja.errors import HttpError



@api_controller('/stock', auth=JWTAuth())
class StockController:

    # PARCELS (EUDR Compliance)

    @route.get('/parcels', response=List[ParcelResponseSchema])
    def list_parcels(self, request):
        return Parcel.objects.filter(farmer=request.user)

    @route.post('/parcels', response=ParcelResponseSchema)
    def create_parcel(self, request, data: ParcelCreateSchema):
        parcel = Parcel.objects.create(**data.dict())
        return parcel

    @route.get('/parcels/{parcel_id}', response=ParcelResponseSchema)
    def get_parcel(self, request, parcel_id: str):
        return get_object_or_404(Parcel, id=parcel_id, farmer=request.user)

    @route.patch('/parcels/{parcel_id}', response=ParcelResponseSchema)
    def update_parcel(self, request, parcel_id: str, data: ParcelUpdateSchema):
        parcel = get_object_or_404(Parcel, id=parcel_id)
        
        # Seul le propriétaire ou un gestionnaire de magasin peut modifier
        if parcel.farmer != request.user and not request.user.is_store:
            raise HttpError(403, "Non autorisé")

        for attr, value in data.dict(exclude_unset=True).items():
            setattr(parcel, attr, value)
        
        # Si c'est un magasin qui valide, on enregistre qui a fait l'action
        if request.user.is_store and data.status:
            parcel.validated_by = request.user
            
        parcel.save()
        return parcel


    # BATCHES (Traceability Units)

    @route.get('/batches', response=List[BatchResponseSchema])
    def list_batches(self, request, store_id: Optional[int] = None, farmer_id: Optional[int] = None):
        qs = Batch.objects.all()
        if store_id:
            qs = qs.filter(validated_by_id=store_id)
        if farmer_id:
            qs = qs.filter(farmer_id=farmer_id)
        return qs

    @route.post('/batches', response=BatchResponseSchema)
    def create_batch(self, request, data: BatchCreateSchema):
        # Générer un code unique s'il n'est pas fourni
        if not data.unique_code:
            import datetime
            year = datetime.date.today().year
            count = Batch.objects.count() + 1
            data.unique_code = f"TRC-{year}-{count:04d}"
            
        batch = Batch.objects.create(**data.dict())
        return batch

    @route.get('/batches/farmer/{farmer_id}', response=List[BatchResponseSchema], auth=None)
    def list_farmer_batches(self, request, farmer_id: int):
        """Endpoint public pour récupérer les lots d'un agriculteur spécifique."""
        return Batch.objects.filter(farmer_id=farmer_id).order_by('-created_at')

    @route.get('/batches/{batch_id}', response=BatchResponseSchema)
    def get_batch(self, request, batch_id: str):
        return get_object_or_404(Batch, id=batch_id)

    @route.patch('/batches/{batch_id}', response=BatchResponseSchema)
    def update_batch(self, request, batch_id: str, data: BatchUpdateSchema):
        batch = get_object_or_404(Batch, id=batch_id)
        
        if batch.farmer != request.user and not request.user.is_store:
            raise HttpError(403, "Non autorisé")

        for attr, value in data.dict(exclude_unset=True).items():
            setattr(batch, attr, value)

        if request.user.is_store and data.status:
            batch.validated_by = request.user

        batch.save()
        return batch


    # HARVESTS (Weight logs)

    @route.post('/harvests', response=HarvestResponseSchema)
    def create_harvest(self, request, data: HarvestCreateSchema):
        harvest = Harvest.objects.create(**data.dict())
        return harvest


    # TRANSFERS (Chain of Custody)

    @route.post('/transfers', response=BatchTransferResponseSchema)
    def create_transfer(self, request, data: BatchTransferCreateSchema):
        transfer = BatchTransfer.objects.create(**data.dict())
        return transfer

    @route.patch('/transfers/{transfer_id}/confirm', response=BatchTransferResponseSchema)
    def confirm_transfer(self, request, transfer_id: str):
        transfer = get_object_or_404(BatchTransfer, id=transfer_id, receiver=request.user)
        transfer.status = 'confirmed'
        import django.utils.timezone
        transfer.confirmed_at = django.utils.timezone.now()
        transfer.save()
        return transfer