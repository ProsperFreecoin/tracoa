from django.contrib import admin
from .models import Parcel, Batch, Harvest, BatchTransfer


@admin.register(Parcel)
class ParcelAdmin(admin.ModelAdmin):
    list_display = ('name', 'farmer', 'area', 'status', 'created_at')
    search_fields = ('name', 'farmer__email', 'farmer__first_name')
    list_filter = ('status',)
    readonly_fields = ('id', 'created_at', 'updated_at')


@admin.register(Batch)
class BatchAdmin(admin.ModelAdmin):
    list_display = ('unique_code', 'crop_type', 'farmer', 'parcel', 'status',
                    'estimated_quantity', 'blockchain_tx_hash', 'created_at')
    search_fields = ('unique_code', 'farmer__email', 'parcel__name')
    list_filter = ('crop_type', 'status', 'season')
    readonly_fields = ('id', 'blockchain_tx_hash', 'created_at', 'updated_at')


@admin.register(Harvest)
class HarvestAdmin(admin.ModelAdmin):
    list_display = ('batch', 'farmer', 'quantity', 'harvest_date', 'created_at')
    search_fields = ('batch__unique_code', 'farmer__email')
    list_filter = ('harvest_date',)


@admin.register(BatchTransfer)
class BatchTransferAdmin(admin.ModelAdmin):
    list_display = ('batch', 'transfer_type', 'sender', 'receiver',
                    'quantity', 'status', 'blockchain_tx_hash', 'created_at')
    search_fields = ('batch__unique_code', 'sender__email', 'receiver__email')
    list_filter = ('transfer_type', 'status')
    readonly_fields = ('id', 'blockchain_tx_hash', 'created_at')
