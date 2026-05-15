export type TypeProduit = 'cacao' | 'cafe';

export type LotStatut = 'en_attente_coop' | 'valide' | 'rejete' | 'enregistre' | 'transfere' | 'enTransformation' | 'exporte' | 'eudrConforme';

export type KycStatut = 'non_soumis' | 'en_attente' | 'verifie' | 'rejete';

export interface Agriculteur {
  id: string;
  nom: string;
  prenom: string;
  email?: string;
  secteur?: string;
  telephone?: string;
  region?: string;
  cooperative?: string;
  certifie: boolean;
  photoUrl?: string;           // URL Cloudinary de la photo de profil
  kycStatut?: KycStatut;       // Statut de la vérification KYC
  kycDocumentUrl?: string;     // URL recto de la pièce d'identité
  kycDocumentVersoUrl?: string;// URL verso de la pièce d'identité
  kycSoumisLe?: string;        // ISO date de soumission KYC

  // Nouveaux champs Backend Django
  djangoId?: number;           // ID interne Django
  isVerified?: boolean;        // Email vérifié (OTP)
  
  // Champs Organisation (Entreprise / Institution)
  orgName?: string;
  personToCall?: string;
  ptcNumber?: string;
  address?: string;
  country?: string;
  
  // Entreprise
  recordNumber?: string;
  taxNumber?: string;
  
  // Institution
  legalNumber?: string;
  website?: string;
  
  // Magasin
  storeName?: string;
  storeAddress?: string;
}

export interface Lot {
  id: string;
  lotId: string; // ex: LOT-2026-0042
  agriculteurId: string;
  cooperativeId?: string; // ID de la coopérative choisie
  typeProduit: TypeProduit;
  poidsKg: number;
  latitude: number;
  longitude: number;
  dateRecolte: Date | string;
  dateEnregistrement: Date | string;
  statut: LotStatut;
  photoPath?: string;
  notesQualite?: string;
  blockchainTxHash?: string;
  syncBlockchain: boolean;
  agriculteurNom?: string;
  motifRejet?: string;
}

export interface Cooperative {
  id: string;
  nom: string;
  region: string;
  contactEmail?: string;
  contactTel?: string;
  logo?: string;
}

export interface Notification {
  id: string;
  destinataireId: string; // ID de la coopérative
  type: 'demande_reception' | 'info';
  date: Date | string;
  lu: boolean;
  message: string;
  metadata?: {
    lotId: string;
    agriculteurId: string;
    agriculteurNom: string;
  };
}

export interface EtapeTransfert {
  id: string;
  lotId: string;
  acteur: string;
  role: 'ferme' | 'cooperative' | 'transformateur' | 'exportateur';
  date: Date | string;
  notes?: string;
}

// Helpers
export const getTypeProduitLabel = (type: TypeProduit): string => {
  return type === 'cacao' ? 'Cacao' : 'Café';
};

export const getTypeProduitEmoji = (type: TypeProduit): string => {
  return type === 'cacao' ? '🍫' : '☕';
};

export const getLotStatutLabel = (statut: LotStatut): string => {
  switch (statut) {
    case 'en_attente_coop': return 'En attente Coopérative';
    case 'valide': return 'Validé (Blockchain)';
    case 'rejete': return 'Rejeté';
    case 'enregistre': return 'Enregistré';
    case 'transfere': return 'Transféré';
    case 'enTransformation': return 'En transformation';
    case 'exporte': return 'Exporté';
    case 'eudrConforme': return 'EUDR ✓';
    default: return statut;
  }
};
