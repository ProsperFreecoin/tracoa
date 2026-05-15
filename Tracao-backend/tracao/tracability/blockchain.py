"""
Service Blockchain pour la traçabilité ChainCacao.
Gère le déploiement et l'interaction avec le smart contract Vyper.

En dev  → EthereumTesterProvider (in-memory, sans frais)
En prod → connexion à un vrai nœud via RPC_URL dans les variables d'env
"""
import os
import json
from web3 import Web3
from django.conf import settings


# Chemins des fichiers compilés

_CONTRACTS_DIR = os.path.join(settings.BASE_DIR.parent, 'contracts')
ABI_PATH      = os.path.join(_CONTRACTS_DIR, 'abi.json')
BYTECODE_PATH = os.path.join(_CONTRACTS_DIR, 'bytecode.txt')


class BlockchainService:
    """
    Singleton qui gère la connexion et les interactions avec le
    smart contract Traceability déployé sur la blockchain.
    """
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def _initialize(self):
        if self._initialized:
            return

        rpc_url = os.getenv('BLOCKCHAIN_RPC_URL', '')

        if rpc_url:
            # ── Mode production : nœud externe (Infura, Alchemy, nœud local Hardhat…)
            self.w3 = Web3(Web3.HTTPProvider(rpc_url))
            self.w3.eth.default_account = os.getenv('BLOCKCHAIN_ACCOUNT', self.w3.eth.accounts[0])
            print(f"🔗 Blockchain: Connexion RPC → {rpc_url}")
        else:
            # ── Mode développement : Ethereum Tester en mémoire
            from web3.providers.eth_tester import EthereumTesterProvider
            self.w3 = Web3(EthereumTesterProvider())
            self.w3.eth.default_account = self.w3.eth.accounts[0]
            print("⚠️  Blockchain: Mode DEV (in-memory EthereumTester)")

        # Chargement ABI + Bytecode
        with open(ABI_PATH, 'r') as f:
            self.abi = json.load(f)
        with open(BYTECODE_PATH, 'r') as f:
            self.bytecode = f.read().strip()

        # Déploiement du contrat
        contract_class = self.w3.eth.contract(abi=self.abi, bytecode=self.bytecode)
        tx_hash  = contract_class.constructor().transact()
        receipt  = self.w3.eth.wait_for_transaction_receipt(tx_hash)

        self.contract_address = receipt.contractAddress
        self.contract = self.w3.eth.contract(address=self.contract_address, abi=self.abi)

        self._initialized = True
        print(f"✅ Blockchain: Contrat ChainCacao déployé → {self.contract_address}")

    # ──────────────────────────────────────────────────────
    # API Publique
    # ──────────────────────────────────────────────────────

    def create_batch(
        self,
        batch_id: str,
        unique_code: str,
        farmer_email: str,
        farmer_id: str,
        crop_type: str,
        weight: str,
        origin: str,
        gps: str = "",
    ) -> str | None:
        """
        Enregistre un nouveau lot sur la blockchain.
        Retourne le hash de la transaction ou None en cas d'erreur.
        """
        self._initialize()
        try:
            tx = self.contract.functions.create_batch(
                str(batch_id),
                str(unique_code),
                str(farmer_email),
                str(farmer_id),
                str(crop_type),
                str(weight),
                str(origin),
                str(gps),
            ).transact()
            receipt = self.w3.eth.wait_for_transaction_receipt(tx)
            return receipt.transactionHash.hex()
        except Exception as e:
            print(f"❌ Blockchain.create_batch: {e}")
            return None

    def log_transfer(
        self,
        batch_id: str,
        unique_code: str,
        sender_email: str,
        receiver_email: str,
        transfer_type: str,
    ) -> str | None:
        """
        Enregistre un transfert de lot entre deux acteurs.
        Retourne le hash de la transaction ou None en cas d'erreur.
        """
        self._initialize()
        try:
            tx = self.contract.functions.log_transfer(
                str(unique_code),
                str(sender_email),
                str(receiver_email),
                str(transfer_type),
            ).transact()
            receipt = self.w3.eth.wait_for_transaction_receipt(tx)
            return receipt.transactionHash.hex()
        except Exception as e:
            print(f"❌ Blockchain.log_transfer: {e}")
            return None

    def certify_on_chain(
        self,
        unique_code: str,
        certifier_email: str,
        certification_name: str,
    ) -> str | None:
        """
        Enregistre une certification sur la blockchain.
        """
        self._initialize()
        try:
            tx = self.contract.functions.certify_batch(
                str(unique_code),
                str(certifier_email),
                str(certification_name),
            ).transact()
            receipt = self.w3.eth.wait_for_transaction_receipt(tx)
            return receipt.transactionHash.hex()
        except Exception as e:
            print(f"❌ Blockchain.certify_on_chain: {e}")
            return None

    def get_batch(self, unique_code: str) -> dict | None:
        """
        Récupère les données immuables d'un lot depuis la blockchain.
        Utilisé pour la vérification publique (scan QR).
        """
        self._initialize()
        try:
            raw = self.contract.functions.get_batch(str(unique_code)).call()
            if not raw or raw[0] == "":
                return None
            return {
                "batch_id":      raw[0],
                "unique_code":   raw[1],
                "farmer_email":  raw[2],
                "farmer_id":     raw[3],
                "crop_type":     raw[4],
                "weight_kg":     raw[5],
                "origin_name":   raw[6],
                "gps_reference": raw[7],
                "registered_at": raw[8],
            }
        except Exception as e:
            print(f"❌ Blockchain.get_batch: {e}")
            return None

    def get_transfer_count(self, unique_code: str) -> int:
        """Retourne le nombre de transferts enregistrés pour un lot."""
        self._initialize()
        try:
            return self.contract.functions.transfer_count(str(unique_code)).call()
        except Exception as e:
            print(f"❌ Blockchain.get_transfer_count: {e}")
            return 0

    def get_transfer(self, unique_code: str, index: int) -> dict | None:
        """Retourne le transfert à l'index donné pour un lot."""
        self._initialize()
        try:
            raw = self.contract.functions.get_transfer(str(unique_code), index).call()
            return {
                "unique_code":    raw[0],
                "sender":         raw[1],
                "receiver":       raw[2],
                "transfer_type":  raw[3],
                "transferred_at": raw[4],
            }
        except Exception as e:
            print(f"❌ Blockchain.get_transfer: {e}")
            return None


# Instance globale (singleton)
blockchain = BlockchainService()
