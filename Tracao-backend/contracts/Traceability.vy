# pragma version ^0.4.0
# @title ChainCacao Traceability Contract
# @notice Contrat de traçabilité pour la filière café-cacao du Togo (MIABE Hackathon 2026)
# @dev Chaque lot (Batch) est immuablement enregistré avec ses données d'origine EUDR


# ÉVÉNEMENTS — émis à chaque action importante


event BatchRegistered:
    unique_code: String[50]
    farmer_id: String[100]
    crop_type: String[20]
    timestamp: uint256

event BatchTransferred:
    unique_code: String[50]
    sender: String[100]
    receiver: String[100]
    transfer_type: String[30]
    timestamp: uint256

event BatchCertified:
    unique_code: String[50]
    certifier: String[100]
    certification_name: String[100]
    timestamp: uint256


# STRUCTURES DE DONNÉES


struct BatchRecord:
    # Identifiants
    batch_id: String[100]        # UUID interne Django
    unique_code: String[50]      # Code lisible (TRC-2025-XXXX)
    # Producteur
    farmer_email: String[100]
    farmer_id: String[100]       # ID Django du farmer
    # Produit
    crop_type: String[20]        # 'cacao' ou 'cafe'
    weight_kg: String[20]        # Quantité estimée en kg
    # Origine géographique (EUDR)
    origin_name: String[200]     # Nom de la parcelle / village
    gps_reference: String[100]   # "lat:X,lng:Y" du 1er point de la parcelle
    # Blockchain
    registered_at: uint256       # block.timestamp de l'enregistrement

struct TransferRecord:
    unique_code: String[50]
    sender: String[100]
    receiver: String[100]
    transfer_type: String[30]
    transferred_at: uint256


# STOCKAGE — données immuables sur la chaîne


# Lots enregistrés : unique_code → BatchRecord
batches: public(HashMap[String[50], BatchRecord])
batch_exists: public(HashMap[String[50], bool])

# Historique des transferts par lot : unique_code → compteur
transfer_count: public(HashMap[String[50], uint256])

# Transferts : unique_code + index → TransferRecord
transfers: public(HashMap[String[50], HashMap[uint256, TransferRecord]])

# Certifications : unique_code → compteur
certification_count: public(HashMap[String[50], uint256])

# Admin du contrat (déployeur)
owner: public(address)



# INITIALISATION


@deploy
def __init__():
    self.owner = msg.sender



# FONCTIONS EXTERNES


@external
def create_batch(
    _batch_id: String[100],
    _unique_code: String[50],
    _farmer_email: String[100],
    _farmer_id: String[100],
    _crop_type: String[20],
    _weight_kg: String[20],
    _origin_name: String[200],
    _gps_reference: String[100],
):
    """
    @notice Enregistre un nouveau lot sur la blockchain.
    @dev Appelé automatiquement par Django à la création d'un Batch.
         Ne peut être appelé qu'une seule fois par unique_code.
    """
    assert not self.batch_exists[_unique_code], "Ce lot est deja enregistre"

    self.batches[_unique_code] = BatchRecord(
        batch_id=_batch_id,
        unique_code=_unique_code,
        farmer_email=_farmer_email,
        farmer_id=_farmer_id,
        crop_type=_crop_type,
        weight_kg=_weight_kg,
        origin_name=_origin_name,
        gps_reference=_gps_reference,
        registered_at=block.timestamp,
    )
    self.batch_exists[_unique_code] = True

    log BatchRegistered(
        unique_code=_unique_code,
        farmer_id=_farmer_id,
        crop_type=_crop_type,
        timestamp=block.timestamp,
    )


@external
def log_transfer(
    _unique_code: String[50],
    _sender: String[100],
    _receiver: String[100],
    _transfer_type: String[30],
):
    """
    @notice Enregistre un transfert de lot entre deux acteurs.
    @dev Le lot doit exister. Appelé par Django à la création d'un BatchTransfer.
    """
    assert self.batch_exists[_unique_code], "Lot introuvable"

    idx: uint256 = self.transfer_count[_unique_code]
    self.transfers[_unique_code][idx] = TransferRecord(
        unique_code=_unique_code,
        sender=_sender,
        receiver=_receiver,
        transfer_type=_transfer_type,
        transferred_at=block.timestamp,
    )
    self.transfer_count[_unique_code] = idx + 1

    log BatchTransferred(
        unique_code=_unique_code,
        sender=_sender,
        receiver=_receiver,
        transfer_type=_transfer_type,
        timestamp=block.timestamp,
    )


@external
def certify_batch(
    _unique_code: String[50],
    _certifier: String[100],
    _certification_name: String[100],
):
    """
    @notice Enregistre une certification (Fairtrade, Bio EU, etc.) sur la blockchain.
    """
    assert self.batch_exists[_unique_code], "Lot introuvable"
    idx: uint256 = self.certification_count[_unique_code]
    self.certification_count[_unique_code] = idx + 1

    log BatchCertified(
        unique_code=_unique_code,
        certifier=_certifier,
        certification_name=_certification_name,
        timestamp=block.timestamp,
    )


@view
@external
def get_batch(
    _unique_code: String[50]
) -> BatchRecord:
    """
    @notice Retourne les données immuables d'un lot.
    @dev Utilisé par l'API de scan QR pour la vérification publique.
    """
    return self.batches[_unique_code]


@view
@external
def get_transfer(
    _unique_code: String[50],
    _index: uint256
) -> TransferRecord:
    """
    @notice Retourne le transfert à l'index donné pour un lot.
    """
    assert _index < self.transfer_count[_unique_code], "Index invalide"
    return self.transfers[_unique_code][_index]
