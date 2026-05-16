"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Lot, LotStatut, TypeProduit, Notification, Cooperative } from '../types';
import { useAgriculteur } from './AgriculteurContext';
import { getLotsForProducer, getLotsForCooperative, pushLotToDjangoBlockchain } from '../lib/djangoApi';

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
  ajouterLot: (params: Omit<Lot, 'id' | 'lotId' | 'dateEnregistrement' | 'statut' | 'syncBlockchain'> & { agriculteurNom: string }) => Promise<Lot>;
  chargerLotsProducteur: (producerId: number) => Promise<void>;
  chargerLotsCooperative: (cooperativeId: string) => Promise<void>;
  trouverParId: (lotId: string) => Lot | undefined;
  accepterLot: (lotId: string, coopDjangoId: number, producerDjangoId: number, producerEmail: string) => Promise<void>;
  refuserLot: (lotId: string, motifRejet: string) => Promise<void>;
}

const LotsContext = createContext<LotsContextType | undefined>(undefined);

export const LotsProvider = ({ children }: { children: ReactNode }) => {
  const { agriculteur } = useAgriculteur();
  const [lots, setLots] = useState<Lot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger automatiquement les lots de l'utilisateur connecté depuis Django
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

  // Ne plus utiliser localStorage de manière globale pour éviter les mélanges entre utilisateurs.

  const genererLotId = () => {
    const annee = new Date().getFullYear();
    const numero = (lots.length + 1).toString().padStart(4, '0');
    return `LOT-${annee}-${numero}`;
  };

  const ajouterLot = async (params: Omit<Lot, 'id' | 'lotId' | 'dateEnregistrement' | 'statut' | 'syncBlockchain'> & { agriculteurNom: string }): Promise<Lot> => {
    setIsLoading(true);
    setError(null);

    try {
      const { DJANGO_API_BASE } = await import("../lib/djangoApi");
      const token = localStorage.getItem("tracao_token");

      // Préparation du payload pour Django
      const stockProducerPayload = {
        producer: agriculteur?.djangoId,
        cooperative: params.cooperativeId ? parseInt(params.cooperativeId) : null,
        weight: params.poidsKg,
        date: new Date(params.dateRecolte).toISOString().split('T')[0],
        product_type: params.typeProduit,
        origin: "Django Mobile",
        surface_size: 0,
        production_size: params.poidsKg,
        farm_id: params.farmId
      };

      const res = await fetch(`${DJANGO_API_BASE}/stock/stock_producer`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(stockProducerPayload)
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
      }

      const djangoLotData = await res.json();

      // Mappage de la réponse Django vers notre modèle local
      const lot: Lot = {
        id: djangoLotData.id.toString(),
        lotId: `LOT-DJ-${djangoLotData.id}`,
        agriculteurId: params.agriculteurId,
        cooperativeId: params.cooperativeId,
        typeProduit: params.typeProduit,
        poidsKg: params.poidsKg,
        latitude: params.latitude,
        longitude: params.longitude,
        dateRecolte: params.dateRecolte,
        dateEnregistrement: djangoLotData.date || new Date().toISOString(),
        statut: 'en_attente_magasinier',
        photoPath: params.photoPath,
        notesQualite: params.notesQualite,
        agriculteurNom: params.agriculteurNom,
        syncBlockchain: false,
        farmId: params.farmId,
      };
      
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
      const data = await getLotsForProducer(producerId);
      const mappedLots: Lot[] = data.map((sp: any) => ({
        id: sp.id.toString(),
        lotId: `LOT-DJ-${sp.id}`,
        agriculteurId: sp.producer.toString(),
        cooperativeId: sp.cooperative.toString(),
        typeProduit: sp.product_type as TypeProduit,
        poidsKg: sp.weight,
        latitude: 0, // Django doesn't store this in StockProducer yet
        longitude: 0,
        dateRecolte: sp.date,
        dateEnregistrement: sp.date,
        statut: sp.batch_number ? 'transfere' : 'en_attente_magasinier',
        blockchainTxHash: sp.batch_number,
        syncBlockchain: !!sp.batch_number,
        agriculteurNom: "Producteur",
        farmId: sp.farm
      }));
      setLots(mappedLots);
    } catch (e) {
      console.error("Erreur lots Django:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const chargerLotsCooperative = async (cooperativeId: string) => {
    setIsLoading(true);
    try {
      const data = await getLotsForCooperative(parseInt(cooperativeId));
      const mappedLots: Lot[] = data.map((so: any) => ({
        id: so.producer_stock.id.toString(),
        lotId: `LOT-DJ-${so.producer_stock.id}`,
        agriculteurId: so.producer_stock.producer.toString(),
        cooperativeId: so.cooperative.toString(),
        typeProduit: so.producer_stock.product_type as TypeProduit,
        poidsKg: so.producer_stock.weight,
        latitude: 0,
        longitude: 0,
        dateRecolte: so.producer_stock.date,
        dateEnregistrement: so.producer_stock.date,
        statut: so.is_confirmed ? 'transfere' : 'en_attente_magasinier',
        blockchainTxHash: so.producer_stock.batch_number,
        syncBlockchain: !!so.producer_stock.batch_number,
        agriculteurNom: "Producteur",
        farmId: so.producer_stock.farm
      }));
      setLots(mappedLots);
    } catch (e) {
      console.error("Erreur lots Coop Django:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const trouverParId = (lotId: string) => {
    return lots.find(l => l.lotId === lotId);
  };

  const accepterLot = async (lotId: string, magasinierDjangoId: number, producerDjangoId: number, producerEmail: string) => {
    try {
      const lot = lots.find(l => l.lotId === lotId);
      if (!lot) return;

      // Extract numeric ID from lotId (assuming format LOT-DJ-XX)
      const stockProducerId = parseInt(lot.id);

      const { DJANGO_API_BASE } = await import("../lib/djangoApi");
      const token = localStorage.getItem("tracao_token");

      const res = await fetch(`${DJANGO_API_BASE}/stock/stock_origin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          cooperative: magasinierDjangoId,
          producer_stock: stockProducerId,
          is_confirmed: true
        })
      });

      if (!res.ok) throw new Error("Erreur lors de la validation sur le backend");

      // Mettre à jour l'état local
      setLots(prev => prev.map(l => 
        l.lotId === lotId ? { ...l, statut: 'transfere' as const, syncBlockchain: true } : l
      ));
    } catch (error) {
      console.error("Erreur accepterLot:", error);
      throw error;
    }
  };

  const refuserLot = async (lotId: string, motifRejet: string) => {
    setLots(prev => prev.map(l => l.lotId === lotId ? { ...l, statut: 'rejete', notesQualite: motifRejet } : l));
  };

  const totalLots = lots.length;
  const totalPoidsKg = lots.reduce((sum, l) => sum + l.poidsKg, 0);
  const lotsExportes = lots.filter(l => l.statut === 'exporte' || l.statut === 'eudrConforme').length;
  const lotsEnAttente = lots.filter(l => l.statut === 'en_attente_magasinier').length;
  const lotsSyncronises = lots.filter(l => l.syncBlockchain && l.blockchainTxHash).length;
  const lotsRecents = [...lots].sort((a, b) => new Date(b.dateEnregistrement).getTime() - new Date(a.dateEnregistrement).getTime()).slice(0, 5);

  return (
    <LotsContext.Provider value={{
      lots,
      isLoading,
      error,
      totalLots,
      totalPoidsKg,
      lotsExportes,
      lotsEnAttente,
      lotsSyncronises,
      lotsRecents,
      ajouterLot,
      chargerLotsProducteur,
      chargerLotsCooperative,
      trouverParId,
      accepterLot,
      refuserLot
    }}>
      {children}
    </LotsContext.Provider>
  );
};

export const useLots = () => {
  const context = useContext(LotsContext);
  if (context === undefined) {
    throw new Error('useLots must be used within a LotsProvider');
  }
  return context;
};
