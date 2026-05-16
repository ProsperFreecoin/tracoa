from django.db import models
from user.models import TracaoUser
import uuid



# ÉVÉNEMENT DE TRAÇABILITÉ
# Chaque mouvement du lot est enregistré ici ET sur la blockchain

class TraceabilityEvent(models.Model):
    """
    Journal immuable de traçabilité d'un lot.
    Chaque entrée correspond à une étape du cycle de vie :
    Créé → Reçu coopérative → En transit → Livré → Exporté
    """
    EVENT_TYPES = [
        ('BATCH_CREATED',       'Lot créé par l\'agriculteur'),
        ('RECEIVED_BY_COOP',    'Reçu par la coopérative'),
        ('IN_TRANSIT',          'En transit (Transporteur)'),
        ('DELIVERED_EXPORTER',  'Livré à l\'exportateur'),
        ('CERTIFIED',           'Certifié (Fairtrade / Bio EU / RA)'),
        ('EXPORTED',            'Exporté vers l\'UE'),
        ('QR_SCANNED',          'QR Code scanné par un acheteur'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    batch = models.ForeignKey('stock.Batch', on_delete=models.CASCADE, related_name='traceability_events')
    event_type = models.CharField(max_length=30, choices=EVENT_TYPES)

    actor = models.ForeignKey(
        TracaoUser, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='traceability_actions',
        help_text="L'entité qui a effectué cet événement"
    )
    # Géolocalisation de l'événement (optionnel, utile pour EUDR)
    location_name = models.CharField(max_length=255, blank=True, null=True)
    gps_lat = models.FloatField(null=True, blank=True)
    gps_lng = models.FloatField(null=True, blank=True)

    # Hash de la transaction blockchain correspondante
    blockchain_tx_hash = models.CharField(max_length=200, blank=True, null=True)

    notes = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']
        indexes = [
            models.Index(fields=['batch'], name='idx_trace_batch'),
            models.Index(fields=['event_type'], name='idx_trace_event'),
        ]

    def __str__(self):
        return f"[{self.event_type}] Lot {self.batch_id} — {self.timestamp:%Y-%m-%d %H:%M}"



# CERTIFICATION D'UN LOT
# Fairtrade, Bio EU, Rainforest Alliance, etc.

class BatchCertification(models.Model):
    """
    Label de certification apposé sur un lot par un organisme accrédité.
    Moins de 5% des lots togolais sont certifiés → objectif clé du projet.
    """
    CERTIFICATION_TYPES = [
        ('fairtrade',         'Fairtrade International'),
        ('bio_eu',            'Agriculture Biologique UE'),
        ('rainforest',        'Rainforest Alliance'),
        ('eudr_compliant',    'Conforme EUDR 2025'),
        ('custom',            'Autre certification'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    batch = models.ForeignKey('stock.Batch', on_delete=models.CASCADE, related_name='certifications')
    certifier = models.ForeignKey(
        TracaoUser, on_delete=models.CASCADE,
        related_name='issued_certifications',
        limit_choices_to={'is_certifier': True}
    )
    certification_type = models.CharField(max_length=30, choices=CERTIFICATION_TYPES, default='custom')
    certification_name = models.CharField(max_length=100, help_text="Nom exact du label")
    certificate_file = models.FileField(upload_to='certifications/', blank=True, null=True)
    issued_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.certification_name} — {self.batch_id}"
