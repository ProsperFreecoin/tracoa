"""
API de Traçabilité — ChainCacao
Endpoints publics pour la vérification des lots via QR code et
endpoints protégés pour la gestion des certifications.
"""
import qrcode
import io
from ninja_extra import api_controller, route
from ninja.responses import Response
from tracability.models import TraceabilityEvent, BatchCertification
from user.models import TracaoUser
from tracability.schemas import (
    QRCodeBatchSchema,
    BatchJourneySchema,
    CertifyBatchRequest,
    BatchCertificationSchema,
    TraceabilityEventSchema,
    FarmerSummarySchema,
    ParcelSummarySchema,
)
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from .blockchain import blockchain
from ninja.errors import HttpError


@api_controller('/tracability', auth=None)
class TracabilityController:

    
    # QR CODE — Génération et Lecture
    

    @route.get('/qr/{unique_code}', response=QRCodeBatchSchema)
    def get_batch_by_qr(self, unique_code: str):
        """
        Point d'entrée principal pour le SCAN DE QR CODE.
        Retourne toutes les informations d'un lot : producteur, parcelle GPS,
        historique complet et vérification blockchain.

        Utilisateurs : agriculteurs, coopératives, exportateurs,
        importateurs EU, organismes EUDR.
        """
        from stock.models import Batch
        batch = get_object_or_404(
            Batch.objects.select_related('farmer', 'parcel')
                         .prefetch_related('traceability_events', 'certifications'),
            unique_code=unique_code
        )

        # Vérification blockchain
        chain_data = blockchain.get_batch(unique_code)
        is_verified = chain_data is not None

        # Construction de la réponse farmer
        farmer_data = FarmerSummarySchema(
            id=batch.farmer.id,
            email=batch.farmer.email,
            first_name=batch.farmer.first_name,
            last_name=batch.farmer.last_name,
            phone_number=str(batch.farmer.phone_number) if batch.farmer.phone_number else None,
            situation_geo=batch.farmer.situation_geo,
            country=str(batch.farmer.country) if batch.farmer.country else None,
            cooperative_name=batch.farmer.cooperative_name,
        )

        # Construction de la réponse parcelle
        parcel_data = None
        if batch.parcel:
            parcel_data = ParcelSummarySchema(
                id=str(batch.parcel.id),
                name=batch.parcel.name,
                gps_coordinates=batch.parcel.gps_coordinates,
                area=batch.parcel.area,
            )

        events = [
            TraceabilityEventSchema.from_orm(e)
            for e in batch.traceability_events.all()
        ]
        certifications = [
            BatchCertificationSchema.from_orm(c)
            for c in batch.certifications.all()
        ]

        return QRCodeBatchSchema(
            batch_id=str(batch.id),
            unique_code=batch.unique_code,
            crop_type=batch.crop_type,
            season=batch.season,
            estimated_quantity=batch.estimated_quantity,
            actual_quantity=batch.actual_quantity,
            status=batch.status,
            created_at=batch.created_at,
            farmer=farmer_data,
            parcel=parcel_data,
            events=events,
            certifications=certifications,
            blockchain_verified=is_verified,
            blockchain_data=chain_data,
        )

    @route.get('/qr/{unique_code}/image')
    def generate_qr_image(self, unique_code: str, request):
        """
        Génère l'image QR Code PNG pour un lot.
        Le QR encode l'URL publique de vérification du lot.

        Utilisé pour imprimer l'étiquette physique sur les sacs de café/cacao.
        """
        # Vérifier que le lot existe
        from stock.models import Batch
        get_object_or_404(Batch, unique_code=unique_code)

        # URL que le QR code encode (pointant vers l'API de vérification)
        from django.conf import settings
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        verify_url = f"{frontend_url}/verify/{unique_code}"

        # Génération du QR Code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=10,
            border=4,
        )
        qr.add_data(verify_url)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")

        # Retourner l'image en PNG
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)

        return HttpResponse(buffer.getvalue(), content_type='image/png')

    
    # HISTORIQUE — Journey d'un lot (pour auditeurs et EUDR)
    

    @route.get('/journey/{unique_code}', response=BatchJourneySchema)
    def get_batch_journey(self, unique_code: str):
        """
        Retourne l'historique complet de traçabilité d'un lot.
        Vue orientée audit : toutes les étapes depuis la ferme jusqu'à l'export.
        """
        from stock.models import Batch
        batch = get_object_or_404(
            Batch.objects.select_related('farmer', 'parcel')
                         .prefetch_related('traceability_events', 'certifications'),
            unique_code=unique_code
        )
        chain_data = blockchain.get_batch(unique_code)

        return BatchJourneySchema(
            unique_code=batch.unique_code,
            crop_type=batch.crop_type,
            farmer_email=batch.farmer.email,
            parcel_name=batch.parcel.name if batch.parcel else None,
            events=[TraceabilityEventSchema.from_orm(e) for e in batch.traceability_events.all()],
            certifications=[BatchCertificationSchema.from_orm(c) for c in batch.certifications.all()],
            blockchain_verified=chain_data is not None,
        )

    
    # BLOCKCHAIN — Vérification directe (lecture seule)
    

    @route.get('/verify/{unique_code}')
    def verify_on_blockchain(self, unique_code: str):
        """
        Vérifie l'authenticité d'un lot directement sur la blockchain.
        Retourne les données immuables enregistrées sur la chaîne.
        Idéal pour les importateurs EU qui veulent prouver l'origine EUDR.
        """
        chain_data = blockchain.get_batch(unique_code)

        if not chain_data:
            return {
                "is_authentic": False,
                "message": "Ce lot est introuvable sur la blockchain ChainCacao.",
                "unique_code": unique_code,
            }

        # Nombre de transferts enregistrés on-chain
        transfer_count = blockchain.get_transfer_count(unique_code)

        # Certifications depuis la base de données
        certifications = list(
            BatchCertification.objects.filter(batch__unique_code=unique_code)
            .values_list('certification_name', flat=True)
        )

        return {
            "is_authentic": True,
            "message": "✅ Ce lot est authentifié par la blockchain ChainCacao.",
            "unique_code": unique_code,
            "certifications": certifications,
            "transfer_count": transfer_count,
            "blockchain_record": chain_data,
        }

    @route.get('/verify/{unique_code}/transfers')
    def get_blockchain_transfers(self, unique_code: str):
        """
        Retourne l'historique complet des transferts enregistrés ON-CHAIN pour un lot.
        Données immuables — ne peuvent pas être falsifiées.
        """
        count = blockchain.get_transfer_count(unique_code)
        transfers = []
        for i in range(count):
            t = blockchain.get_transfer(unique_code, i)
            if t:
                transfers.append(t)

        return {
            "unique_code": unique_code,
            "total_transfers": count,
            "transfers": transfers,
        }

    
    # CERTIFICATIONS — Ajout par un organisme accrédité
    

    @route.post('/certify', response=BatchCertificationSchema)
    def certify_batch(self, data: CertifyBatchRequest):
        """
        Permet à un organisme de certification (is_certifier=True) d'apposer
        un label sur un lot. Enregistré en base ET sur la blockchain.
        """
        from stock.models import Batch
        batch = get_object_or_404(Batch, unique_code=data.unique_code)
        certifier = get_object_or_404(TracaoUser, id=data.certifier_id)

        if not certifier.is_certifier:
            raise HttpError(403, "Seuls les organismes de certification peuvent certifier un lot.")

        cert = BatchCertification.objects.create(
            batch=batch,
            certifier=certifier,
            certification_type=data.certification_type,
            certification_name=data.certification_name,
            notes=data.notes,
        )

        # Enregistrement sur la blockchain
        tx_hash = blockchain.certify_on_chain(
            unique_code=batch.unique_code,
            certifier_email=certifier.email,
            certification_name=data.certification_name,
        )

        # Enregistrement dans le journal de traçabilité
        TraceabilityEvent.objects.create(
            batch=batch,
            event_type='CERTIFIED',
            actor=certifier,
            blockchain_tx_hash=tx_hash,
            notes=f"Certification '{data.certification_name}' apposée par {certifier.email}.",
        )

        return cert

    
    # LISTE — Tous les lots
    

    @route.get('/batches')
    def get_all_batches(self):
        """
        Liste tous les lots enregistrés avec leur statut.
        Utile pour le tableau de bord administrateur.
        """
        from stock.models import Batch
        batches = Batch.objects.select_related('farmer', 'parcel').all()
        return [
            {
                "batch_id": str(b.id),
                "unique_code": b.unique_code,
                "crop_type": b.crop_type,
                "season": b.season,
                "status": b.status,
                "farmer_email": b.farmer.email,
                "farmer_name": f"{b.farmer.first_name or ''} {b.farmer.last_name or ''}".strip(),
                "parcel_name": b.parcel.name if b.parcel else None,
                "estimated_quantity": b.estimated_quantity,
                "blockchain_verified": b.blockchain_tx_hash is not None,
                "created_at": b.created_at.isoformat(),
            }
            for b in batches
        ]
