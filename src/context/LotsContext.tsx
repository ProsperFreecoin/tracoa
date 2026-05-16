"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Lot, TypeProduit } from '../types';
import { useAgriculteur } from './AgriculteurContext';
import {
  fetchFarmerBatches,
  fetchCooperativeBatches,
  createBatch,
  updateBatchStatus,
} from '../lib/djangoApi';
import { NotificationService } from '../lib/notifications';

interface LotsContextType {
  lots: Lot[];
  isLoading: boolean;
  error: string | null;
  totalLots: number;
  totalPoidsKg: number;
  lotsExportes: number;
  lotsEnAttente: number;
  lotsSyncronises: number;
  lotsRecents: Lot[];
  ajouterLot: (params: {
    agriculteurId: string;
    agriculteurNom: string;
    cooperativeId?: string;
    typeProduit: TypeProduit;
    poidsKg: number;
    latitude?: number;
    longitude?: number;
    dateRecolte: string;
    photoPath?: string;
    notesQualite?: string;
    label?: string;
    season?: string;
  }) => Promise<Lot>;
  chargerLotsProducteur: (producerId: number) => Promise<void>;
  chargerLotsCooperative: (cooperativeId: string) => Promise<void>;
  trouverParId: (lotId: string) => Lot | undefined;
  accepterLot: (lotId: string, magasinierDjangoId: number, producerDjangoId: number, producerEmail: string, raison?: string) => Promise<void>;
  refuserLot: (lotId: string, motifRejet: string) => Promise<void>;
}

const LotsContext = createContext<LotsContextType | undefined>(undefined);

/** Convertit un Batch Django en modèle Lot local */
const batchToLot = (b: any): Lot => ({
  id: b.id.toString(),
  lotId: b.unique_code || `TRC-${b.id}`,
  agriculteurId: b.farmer_id?.toString() || "",
  cooperativeId: b.validated_by?.toString() || "",
  typeProduit: (b.crop_type as TypeProduit) || "cacao",
  poidsKg: b.estimated_quantity || 0,
  latitude: 0,
  longitude: 0,
  dateRecolte: b.created_at || new Date().toISOString(),
  dateEnregistrement: b.created_at || new Date().toISOString(),
  statut: djangoStatusToLocal(b.status),
  blockchainTxHash: b.blockchain_tx_hash || undefined,
  syncBlockchain: !!b.blockchain_tx_hash,
  agriculteurNom: b.farmer_name || "Producteur",
  farmId: undefined,
  notesQualite: undefined,
  photoPath: undefined,
});

const djangoStatusToLocal = (status: string): Lot["statut"] => {
  const map: Record<string, Lot["statut"]> = {
    draft: "en_attente_magasinier",
    pending: "en_attente_magasinier",
    approved: "transfere",
    rejected: "rejete",
    in_transit: "transfere",
    delivered: "transfere",
    exported: "exporte",
    locked: "exporte",
  };
  return map[status] || "en_attente_magasinier";
};

export const LotsProvider = ({ children }: { children: ReactNode }) => {
  const { agriculteur } = useAgriculteur();
  const [lots, setLots] = useState<Lot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (agriculteur && agriculteur.djangoId) {
      if (agriculteur.secteur === "Coopérative") {
        chargerLotsCooperative(agriculteur.djangoId.toString());
      } else {
        chargerLotsProducteur(agriculteur.djangoId);
      }
    } else {
      setLots([]);
    }
  }, [agriculteur]);

  /** Crée un nouveau lot via l'API Django /stock/batches */
  const ajouterLot = async (params: Parameters<LotsContextType["ajouterLot"]>[0]): Promise<Lot> => {
    setIsLoading(true);
    setError(null);

    try {
      if (!agriculteur?.djangoId) throw new Error("Utilisateur non connecté");

      const djangoBatch = await createBatch({
        farmer_id: agriculteur.djangoId,
        season: params.season || `${new Date().getFullYear()}`,
        crop_type: params.typeProduit,
        estimated_quantity: params.poidsKg,
        label: params.label,
      });

      const lot = batchToLot(djangoBatch);
      setLots(prev => [lot, ...prev]);
      return lot;
    } catch (e: any) {
      setError(`Erreur lors de l'enregistrement: ${e.message}`);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const chargerLotsProducteur = async (producerId: number) => {
    setIsLoading(true);
    try {
      const data = await fetchFarmerBatches(producerId);
      setLots(data.map(batchToLot));
    } catch (e) {
      console.error("Erreur lots Django:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const chargerLotsCooperative = async (cooperativeId: string) => {
    setIsLoading(true);
    try {
      const data = await fetchCooperativeBatches(parseInt(cooperativeId));
      setLots(data.map(batchToLot));
    } catch (e) {
      console.error("Erreur lots Coop Django:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const trouverParId = (lotId: string) => lots.find(l => l.lotId === lotId);

  /** Valide un lot — met son statut à 'approved' sur Django */
  const accepterLot = async (
    lotId: string,
    magasinierDjangoId: number,
    producerDjangoId: number,
    producerEmail: string,
    raison?: string
  ) => {
    try {
      const lot = lots.find(l => l.lotId === lotId);
      if (!lot) return;

      await updateBatchStatus(lot.id, "approved");

      setLots(prev =>
        prev.map(l =>
          l.lotId === lotId
            ? { ...l, statut: "transfere" as const, syncBlockchain: true, notesQualite: raison || l.notesQualite }
            : l
        )
      );

      await NotificationService.sendLocalNotification("Lot Approuvé", `Le lot ${lotId} a été approuvé.`);

      if (producerEmail) {
        await NotificationService.sendEmail(
          producerEmail,
          "Votre lot a été approuvé",
          `Bonjour, le lot ${lotId} a été approuvé par le magasin. Commentaire : ${raison || "Aucun"}`
        );
      }
    } catch (err) {
      console.error("Erreur accepterLot:", err);
      throw err;
    }
  };

  const refuserLot = async (lotId: string, motifRejet: string) => {
    const lot = lots.find(l => l.lotId === lotId);
    if (lot) await updateBatchStatus(lot.id, "rejected").catch(console.error);

    setLots(prev =>
      prev.map(l => l.lotId === lotId ? { ...l, statut: "rejete", notesQualite: motifRejet } : l)
    );

    await NotificationService.sendLocalNotification("Lot Rejeté", `Le lot ${lotId} a été rejeté.`);
  };

  const totalLots = lots.length;
  const totalPoidsKg = lots.reduce((sum, l) => sum + l.poidsKg, 0);
  const lotsExportes = lots.filter(l => l.statut === "exporte" || l.statut === "eudrConforme").length;
  const lotsEnAttente = lots.filter(l => l.statut === "en_attente_magasinier").length;
  const lotsSyncronises = lots.filter(l => l.syncBlockchain && l.blockchainTxHash).length;
  const lotsRecents = [...lots]
    .sort((a, b) => new Date(b.dateEnregistrement).getTime() - new Date(a.dateEnregistrement).getTime())
    .slice(0, 5);

  return (
    <LotsContext.Provider value={{
      lots, isLoading, error,
      totalLots, totalPoidsKg, lotsExportes, lotsEnAttente, lotsSyncronises, lotsRecents,
      ajouterLot, chargerLotsProducteur, chargerLotsCooperative,
      trouverParId, accepterLot, refuserLot,
    }}>
      {children}
    </LotsContext.Provider>
  );
};

export const useLots = () => {
  const context = useContext(LotsContext);
  if (context === undefined) throw new Error('useLots must be used within a LotsProvider');
  return context;
};
