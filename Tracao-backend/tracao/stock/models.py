from django.db import models
from user.models import TracaoUser
import uuid



# PARCELLE — surface agricole géo-référencée

class Parcel(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    farmer = models.ForeignKey(
        TracaoUser, on_delete=models.CASCADE,
        related_name='parcels', limit_choices_to={'is_farmer': True}
    )
    name = models.CharField(max_length=255)
    # Polygone GPS : liste de {lat, lng} — minimum 3 points (exigence EUDR)
    gps_coordinates = models.JSONField(help_text="Polygone GPS — liste de {lat, lng}, min 3 points (EUDR)")
    area = models.FloatField(help_text="Superficie en hectares (calculée automatiquement)", null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    validated_by = models.ForeignKey(
        TracaoUser, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='validated_parcels', limit_choices_to={'is_store': True}
    )

    class Meta:
        indexes = [
            models.Index(fields=['farmer'], name='idx_parcels_farmer'),
            models.Index(fields=['status'], name='idx_parcels_status'),
        ]

    def __str__(self):
        # BUG CORRIGÉ : champ est phone_number, pas phone
        return f"{self.name} ({self.farmer.phone_number})"



# LOT — unité de traçabilité centrale (lié à une parcelle)

class Batch(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending', 'En attente de validation'),
        ('approved', 'Validé'),
        ('rejected', 'Rejeté'),
        ('in_transit', 'En transit'),
        ('delivered', 'Livré'),
        ('exported', 'Exporté'),
        ('locked', 'Verrouillé (blockchain)'),
    ]
    CROP_CHOICES = [
        ('cacao', 'Cacao'),
        ('cafe', 'Café'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    farmer = models.ForeignKey(
        TracaoUser, on_delete=models.CASCADE,
        related_name='batches', limit_choices_to={'is_farmer': True}
    )
    parcel = models.ForeignKey(Parcel, on_delete=models.CASCADE, related_name='batches')
    season = models.CharField(max_length=50, help_text="Ex: 2025-2026")
    crop_type = models.CharField(max_length=20, choices=CROP_CHOICES)
    estimated_quantity = models.FloatField(help_text="Quantité estimée en kg")
    actual_quantity = models.FloatField(null=True, blank=True, help_text="Quantité réelle pesée en kg")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    # Code unique format TRC-ANNÉE-XXXX — utilisé dans les QR codes
    unique_code = models.CharField(max_length=50, unique=True, help_text="Code QR unique : TRC-YYYY-XXXX")

    # Hash de la transaction blockchain pour vérification d'authenticité
    blockchain_tx_hash = models.CharField(max_length=200, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    validated_by = models.ForeignKey(
        TracaoUser, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='validated_batches', limit_choices_to={'is_store': True}
    )

    class Meta:
        unique_together = ('parcel', 'season', 'crop_type')
        indexes = [
            models.Index(fields=['farmer'], name='idx_batches_farmer'),
            models.Index(fields=['parcel'], name='idx_batches_parcel'),
            models.Index(fields=['status'], name='idx_batches_status'),
            models.Index(fields=['unique_code'], name='idx_batches_code'),
        ]

    def __str__(self):
        return f"{self.unique_code} - {self.crop_type}"



# RÉCOLTE — entrée de poids réel lors de la cueillette

class Harvest(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, related_name='harvests')
    # BUG CORRIGÉ : related_name était 'batches' → conflit. Renommé 'harvest_records'
    farmer = models.ForeignKey(
        TracaoUser, on_delete=models.CASCADE,
        related_name='harvest_records', limit_choices_to={'is_farmer': True}
    )
    quantity = models.FloatField(help_text="Quantité récoltée en kg")
    harvest_date = models.DateField()
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['batch'], name='idx_harvests_batch'),
            models.Index(fields=['harvest_date'], name='idx_harvests_date'),
        ]

    def __str__(self):
        return f"Récolte {self.harvest_date} — {self.quantity}kg ({self.batch.unique_code})"



# TRANSFERT — chaque mouvement du lot entre acteurs

class BatchTransfer(models.Model):
    """
    Remplace 'Transaction' pour éviter la confusion avec les tx financières.
    Représente chaque transfert physique du lot :
    farmer → coopérative → transporteur → exportateur → importateur EU
    """
    TRANSFER_TYPES = [
        ('FARM_TO_COOP', 'Ferme → Coopérative'),
        ('COOP_TO_TRANSPORTER', 'Coopérative → Transporteur'),
        ('TRANSPORTER_TO_EXPORTER', 'Transporteur → Exportateur'),
        ('EXPORTER_TO_EU_IMPORTER', 'Exportateur → Importateur EU'),
        ('CUSTOM', 'Transfert personnalisé'),
    ]
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('confirmed', 'Confirmé'),
        ('cancelled', 'Annulé'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, related_name='transfers')
    sender = models.ForeignKey(
        TracaoUser, on_delete=models.CASCADE, related_name='sent_transfers'
    )
    receiver = models.ForeignKey(
        TracaoUser, on_delete=models.CASCADE, related_name='received_transfers'
    )
    transfer_type = models.CharField(max_length=30, choices=TRANSFER_TYPES, default='CUSTOM')
    quantity = models.FloatField(help_text="Quantité transférée en kg")
    price_per_kg = models.FloatField(null=True, blank=True, help_text="Prix au kg (FCFA)")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    location = models.CharField(max_length=255, blank=True, null=True, help_text="Lieu du transfert")
    # Hash de la transaction blockchain correspondante
    blockchain_tx_hash = models.CharField(max_length=200, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['batch'], name='idx_transfers_batch'),
            models.Index(fields=['sender'], name='idx_transfers_sender'),
            models.Index(fields=['receiver'], name='idx_transfers_receiver'),
            models.Index(fields=['status'], name='idx_transfers_status'),
        ]

    def __str__(self):
        return f"{self.get_transfer_type_display()} — {self.batch.unique_code}"
