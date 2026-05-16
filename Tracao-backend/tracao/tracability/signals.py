"""
Signals de traçabilité automatique.

Chaque fois qu'un Batch est validé ou qu'un BatchTransfer est confirmé,
on enregistre l'événement dans TraceabilityEvent ET sur la blockchain.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from stock.models import Batch, BatchTransfer
from .models import TraceabilityEvent
from .blockchain import blockchain



# Signal 1 : Lot validé → enregistrement blockchain

@receiver(post_save, sender=Batch)
def on_batch_approved(sender, instance, created, **kwargs):
    """
    Quand un lot passe au statut 'approved' (validé par la coopérative)
    et qu'il n'est pas encore sur la blockchain, on l'inscrit avec ses 
    données GPS et son type de culture.
    """
    # On n'inscrit sur la blockchain que si le lot est validé
    # ET qu'il n'a pas encore de hash de transaction (pour éviter les doublons).
    if instance.status != 'approved' or instance.blockchain_tx_hash:
        return

    # Récupérer les coordonnées GPS de la parcelle
    gps_data = ""
    first_point = {}
    if instance.parcel and instance.parcel.gps_coordinates:
        coords = instance.parcel.gps_coordinates
        if coords:
            # On prend le premier point comme point de référence EUDR
            first_point = coords[0] if isinstance(coords, list) else coords
            gps_data = f"lat:{first_point.get('lat', 0)},lng:{first_point.get('lng', 0)}"

    origin_str = (
        f"{instance.parcel.name} — {instance.parcel.farmer.situation_geo}"
        if instance.parcel else instance.farmer.situation_geo or "Togo"
    )

    # 🔗 Enregistrement sur la BLOCKCHAIN
    tx_hash = blockchain.create_batch(
        batch_id=str(instance.id),
        unique_code=instance.unique_code,
        farmer_email=instance.farmer.email,
        farmer_id=str(instance.farmer.id),
        crop_type=instance.crop_type,
        weight=str(instance.estimated_quantity),
        origin=origin_str,
        gps=gps_data,
    )

    # Sauvegarder le hash blockchain sur le lot
    if tx_hash:
        Batch.objects.filter(pk=instance.pk).update(blockchain_tx_hash=tx_hash)

    # 📋 Enregistrement dans le journal de traçabilité
    TraceabilityEvent.objects.create(
        batch=instance,
        event_type='BATCH_CREATED',
        actor=instance.validated_by or instance.farmer,
        location_name=origin_str,
        gps_lat=float(first_point.get('lat', 0)) if first_point else None,
        gps_lng=float(first_point.get('lng', 0)) if first_point else None,
        blockchain_tx_hash=tx_hash,
        notes=f"Lot {instance.unique_code} validé et inscrit sur la blockchain — {instance.crop_type} — {instance.estimated_quantity}kg estimés.",
    )



# Signal 2 : Transfert confirmé → log blockchain

@receiver(post_save, sender=BatchTransfer)
def on_batch_transfer_confirmed(sender, instance, created, **kwargs):
    """
    Quand un BatchTransfer est confirmé (statut 'confirmed') par le destinataire,
    on log l'événement sur la blockchain.
    """
    # On n'inscrit sur la blockchain que si le transfert est confirmé
    # ET qu'il n'a pas encore été loggé (pour éviter les doublons).
    if instance.status != 'confirmed' or instance.blockchain_tx_hash:
        return

    # Mapper le type de transfert vers le type d'événement de traçabilité
    EVENT_MAP = {
        'FARM_TO_COOP':             'RECEIVED_BY_COOP',
        'COOP_TO_TRANSPORTER':      'IN_TRANSIT',
        'TRANSPORTER_TO_EXPORTER':  'DELIVERED_EXPORTER',
        'EXPORTER_TO_EU_IMPORTER':  'EXPORTED',
        'CUSTOM':                   'RECEIVED_BY_COOP',
    }
    event_type = EVENT_MAP.get(instance.transfer_type, 'RECEIVED_BY_COOP')

    # 🔗 Log sur la BLOCKCHAIN
    tx_hash = blockchain.log_transfer(
        batch_id=str(instance.batch.id),
        unique_code=instance.batch.unique_code,
        sender_email=instance.sender.email,
        receiver_email=instance.receiver.email,
        transfer_type=instance.transfer_type,
    )

    # Sauvegarder le hash blockchain sur le transfert
    if tx_hash:
        BatchTransfer.objects.filter(pk=instance.pk).update(blockchain_tx_hash=tx_hash)

    # 📋 Journal de traçabilité
    TraceabilityEvent.objects.create(
        batch=instance.batch,
        event_type=event_type,
        actor=instance.receiver,
        location_name=instance.location,
        blockchain_tx_hash=tx_hash,
        notes=(
            f"Transfert confirmé: {instance.get_transfer_type_display()} — "
            f"{instance.quantity}kg — "
            f"De: {instance.sender.email} → Reçu par: {instance.receiver.email}"
        ),
    )
