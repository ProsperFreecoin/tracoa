"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from "next/navigation";
import { Agriculteur } from '../types';
import { doc, setDoc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { db, auth } from "../lib/firebase";

interface AgriculteurContextType {
  agriculteur: Agriculteur | null;
  estConnecte: boolean;
  connecter: (agri: Agriculteur, token?: string) => Promise<void>;
  deconnecter: () => Promise<void>;
  mettreAJourProfil: (infos: Partial<Agriculteur>) => Promise<void>;
}

const AgriculteurContext = createContext<AgriculteurContextType | undefined>(undefined);

export const AgriculteurProvider = ({ children }: { children: ReactNode }) => {
  const [agriculteur, setAgriculteur] = useState<Agriculteur | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Charger depuis localStorage d'abord pour plus de réactivité
    const savedAgri = localStorage.getItem('tracao_user');
    if (savedAgri) {
      setAgriculteur(JSON.parse(savedAgri));
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docSnap = await getDoc(doc(db, "agriculteurs", user.uid));
          if (docSnap.exists()) {
            const data = docSnap.data() as Agriculteur;
            setAgriculteur(data);
            localStorage.setItem('tracao_user', JSON.stringify(data));
          }
        } catch (e) {
          console.error("Error fetching profile:", e);
        }
      } else if (!localStorage.getItem('tracao_token')) {
        // Si pas de Firebase ET pas de token Django, on déconnecte
        setAgriculteur(null);
        localStorage.removeItem('tracao_user');
      }
      setIsLoaded(true);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    
    const isPublicPath = pathname === '/login' || pathname === '/register' || pathname === '/' || pathname?.startsWith('/magic-link');
    
    if (!agriculteur && !isPublicPath) {
      router.replace('/');
    } else if (agriculteur && (pathname === '/login' || pathname === '/register')) {
      router.replace('/');
    }
  }, [agriculteur, isLoaded, pathname, router]);

  const connecter = async (agri: Agriculteur, token?: string) => {
    setAgriculteur(agri);
    localStorage.setItem('tracao_user', JSON.stringify(agri));
    if (token) localStorage.setItem('tracao_token', token);
    
    try {
      // On continue de synchroniser avec Firebase pour la compatibilité
      await setDoc(doc(db, "agriculteurs", agri.id), agri);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde dans Firebase:", error);
    }
  };

  const deconnecter = async () => {
    await signOut(auth);
    setAgriculteur(null);
    localStorage.removeItem('tracao_user');
    localStorage.removeItem('tracao_token');
    router.replace('/login');
  };
  
  const mettreAJourProfil = async (infos: Partial<Agriculteur>) => {
    if (!agriculteur) return;
    
    const updatedAgri = { ...agriculteur, ...infos };
    setAgriculteur(updatedAgri);
    localStorage.setItem('tracao_user', JSON.stringify(updatedAgri));
    
    try {
      await setDoc(doc(db, "agriculteurs", agriculteur.id), updatedAgri, { merge: true });
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil:", error);
    }
  };

  if (!isLoaded) {
    return <div className="flex items-center justify-center min-h-screen bg-tracao-cream text-tracao-cacao font-bold text-xl h-full w-full">Chargement...</div>;
  }

  return (
    <AgriculteurContext.Provider value={{
      agriculteur,
      estConnecte: !!agriculteur,
      connecter,
      deconnecter,
      mettreAJourProfil
    }}>
      {children}
    </AgriculteurContext.Provider>
  );
};

export const useAgriculteur = () => {
  const context = useContext(AgriculteurContext);
  if (context === undefined) {
    throw new Error('useAgriculteur must be used within an AgriculteurProvider');
  }
  return context;
};
