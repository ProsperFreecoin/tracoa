from django.contrib import admin
from .models import TraceabilityEvent, BatchCertification


@admin.register(TraceabilityEvent)
class TraceabilityEventAdmin(admin.ModelAdmin):
    list_display = ('batch', 'event_type', 'actor', 'location_name',
                    'blockchain_tx_hash', 'timestamp')
    search_fields = ('batch__unique_code', 'actor__email', 'location_name')
    list_filter = ('event_type', 'timestamp')
    readonly_fields = ('id', 'blockchain_tx_hash', 'timestamp')


@admin.register(BatchCertification)
class BatchCertificationAdmin(admin.ModelAdmin):
    list_display = ('batch', 'certifier', 'certification_type', 'certification_name', 'issued_at')
    search_fields = ('batch__unique_code', 'certification_name', 'certifier__email')
    list_filter = ('certification_type', 'issued_at')
    readonly_fields = ('id', 'issued_at')
