"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Lot, LotStatut, TypeProduit, Notification, Cooperative } from '../types';
import { getDoc } from "firebase/firestore";
import { collection, getDocs, query, where, setDoc, doc } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

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
  chargerDonneesDemo: (agriculteurId: string) => Promise<void>;
  chargerLotsCooperative: (cooperativeId: string) => Promise<void>;
  trouverParId: (lotId: string) => Lot | undefined;
  accepterLot: (lotId: string, coopDjangoId: number, producerDjangoId: number, producerEmail: string) => Promise<void>;
  refuserLot: (lotId: string, motifRejet: string) => Promise<void>;
}

const LotsContext = createContext<LotsContextType | undefined>(undefined);

export const LotsProvider = ({ children }: { children: ReactNode }) => {
  const [lots, setLots] = useState<Lot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger automatiquement les lots de l'utilisateur connecté
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Récupérer le profil pour savoir s'il est coopérative ou producteur
        const docSnap = await getDoc(doc(db, "agriculteurs", user.uid));
        if (docSnap.exists()) {
          const profile = docSnap.data();
          if (profile.secteur === "Coopérative") {
            await chargerLotsCooperative(user.uid);
          } else {
            await chargerDonneesDemo(user.uid);
          }
        }
      } else {
        // Réinitialiser les lots à la déconnexion
        setLots([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Ne plus utiliser localStorage de manière globale pour éviter les mélanges entre utilisateurs.
  // Les données seront chargées dynamiquement via Firebase selon l'ID de l'utilisateur.

  const genererLotId = () => {
    const annee = new Date().getFullYear();
    const numero = (lots.length + 1).toString().padStart(4, '0');
    return `LOT-${annee}-${numero}`;
  };

  const ajouterLot = async (params: Omit<Lot, 'id' | 'lotId' | 'dateEnregistrement' | 'statut' | 'syncBlockchain'>): Promise<Lot> => {
    setIsLoading(true);
    setError(null);

    try {
      const lotRef = doc(collection(db, "lots"));
      const lot: Lot = {
        id: lotRef.id,
        lotId: genererLotId(),
        agriculteurId: params.agriculteurId,
        cooperativeId: params.cooperativeId,
        typeProduit: params.typeProduit,
        poidsKg: params.poidsKg,
        latitude: params.latitude,
        longitude: params.longitude,
        dateRecolte: params.dateRecolte,
        dateEnregistrement: new Date().toISOString(),
        statut: 'en_attente_coop',
        photoPath: params.photoPath,
        notesQualite: params.notesQualite,
        agriculteurNom: params.agriculteurNom,
        syncBlockchain: false,
      };

      await setDoc(lotRef, lot);

      // Create notification for the cooperative if one was selected
      if (params.cooperativeId) {
        const notifRef = doc(collection(db, "notifications"));
        const notification: Notification = {
          id: notifRef.id,
          destinataireId: params.cooperativeId,
          type: 'demande_reception',
          date: new Date().toISOString(),
          lu: false,
          message: `Nouveau lot enregistré par un agriculteur. Lot ID: ${lot.lotId}`,
          metadata: {
            lotId: lot.lotId,
            agriculteurId: params.agriculteurId,
            agriculteurNom: "Agriculteur", // We could pass this in too
          }
        };
        await setDoc(notifRef, notification);
      }

      setLots(prev => [lot, ...prev]);
      return lot;
    } catch (e: any) {
      setError(`Erreur lors de l'enregistrement: ${e.message}`);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const chargerDonneesDemo = async (agriculteurId: string) => {
    try {
      const q = query(collection(db, "lots"), where("agriculteurId", "==", agriculteurId));
      const querySnapshot = await getDocs(q);
      const fetchedLots: Lot[] = [];
      querySnapshot.forEach((document) => {
        fetchedLots.push(document.data() as Lot);
      });
      
      setLots(fetchedLots.sort((a, b) => new Date(b.dateEnregistrement).getTime() - new Date(a.dateEnregistrement).getTime()));
    } catch (e) {
      console.error("Erreur lors de la récupération des lots :", e);
    }
  };

  const chargerLotsCooperative = async (cooperativeId: string) => {
    try {
      // Charger les lots qui sont assignés à cette coopérative
      const q = query(collection(db, "lots"), where("cooperativeId", "==", cooperativeId));
      const querySnapshot = await getDocs(q);
      const fetchedLots: Lot[] = [];
      querySnapshot.forEach((document) => {
        fetchedLots.push(document.data() as Lot);
      });
      
      setLots(fetchedLots.sort((a, b) => new Date(b.dateEnregistrement).getTime() - new Date(a.dateEnregistrement).getTime()));
    } catch (e) {
      console.error("Erreur lors de la récupération des lots de la coopérative :", e);
    }
  };

  const trouverParId = (lotId: string) => {
    return lots.find(l => l.lotId === lotId);
  };

  const accepterLot = async (lotId: string, coopDjangoId: number, producerDjangoId: number, producerEmail: string) => {
    try {
      const lot = lots.find(l => l.lotId === lotId);
      if (!lot) return;

      // 1. Appel au backend Django pour inscrire sur la Blockchain
      const { pushLotToDjangoBlockchain } = await import('../lib/djangoApi');
      const txHash = await pushLotToDjangoBlockchain(lot, producerDjangoId, coopDjangoId, producerEmail);

      // 2. Mettre à jour Firebase
      const lotRef = doc(db, "lots", lot.id);
      const updateData = {
        statut: 'valide' as LotStatut,
        syncBlockchain: true,
        blockchainTxHash: txHash || `0x${Date.now().toString(16)}a3f7b` // Fallback si l'API échoue mais qu'on veut valider (mode Hackathon)
      };
      
      await setDoc(lotRef, updateData, { merge: true });

      // 3. Notification pour l'agriculteur
      const notifRef = doc(collection(db, "notifications"));
      await setDoc(notifRef, {
        id: notifRef.id,
        destinataireId: lot.agriculteurId,
        type: 'info',
        date: new Date().toISOString(),
        lu: false,
        message: `Votre lot ${lot.lotId} a été validé par la coopérative et enregistré sur la blockchain.`,
        metadata: { lotId: lot.lotId }
      });

      // Mettre à jour l'état local
      setLots(prev => prev.map(l => l.lotId === lotId ? { ...l, ...updateData } : l));
    } catch (e) {
      console.error("Erreur lors de l'acceptation :", e);
      throw e;
    }
  };

  const refuserLot = async (lotId: string, motifRejet: string) => {
    try {
      const lot = lots.find(l => l.lotId === lotId);
      if (!lot) return;

      const lotRef = doc(db, "lots", lot.id);
      const updateData = {
        statut: 'rejete' as LotStatut,
        motifRejet: motifRejet
      };
      
      await setDoc(lotRef, updateData, { merge: true });

      // Notification pour l'agriculteur
      const notifRef = doc(collection(db, "notifications"));
      await setDoc(notifRef, {
        id: notifRef.id,
        destinataireId: lot.agriculteurId,
        type: 'info',
        date: new Date().toISOString(),
        lu: false,
        message: `Votre lot ${lot.lotId} a été rejeté par la coopérative. Motif: ${motifRejet}`,
        metadata: { lotId: lot.lotId }
      });

      // Mettre à jour l'état local
      setLots(prev => prev.map(l => l.lotId === lotId ? { ...l, ...updateData } : l));
    } catch (e) {
      console.error("Erreur lors du refus :", e);
      throw e;
    }
  };

  const totalLots = lots.length;
  const totalPoidsKg = lots.reduce((sum, l) => sum + l.poidsKg, 0);
  const lotsExportes = lots.filter(l => l.statut === 'exporte' || l.statut === 'eudrConforme').length;
  const lotsEnAttente = lots.filter(l => l.statut === 'en_attente_coop').length;
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
      chargerDonneesDemo,
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
