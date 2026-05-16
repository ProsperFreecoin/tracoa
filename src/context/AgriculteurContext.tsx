"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from "next/navigation";
import { Agriculteur } from '../types';
import { getCurrentUser } from "../lib/djangoApi";

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
    const initializeAuth = async () => {
      // 1. Charger depuis localStorage pour la réactivité
      const savedAgri = localStorage.getItem('tracao_user');
      if (savedAgri) {
        setAgriculteur(JSON.parse(savedAgri));
      }

      // 2. Vérifier la validité du token avec Django
      const token = localStorage.getItem('tracao_token');
      if (token) {
        try {
          const user = await getCurrentUser();
          if (user) {
            // Mapper les données Django vers le type Agriculteur frontend
            const mappedAgri: Agriculteur = {
              id: user.id.toString(),
              djangoId: user.id,
              nom: user.last_name || user.org_name || "Nom",
              prenom: user.first_name || "",
              email: user.email,
              telephone: user.phone_number,
              region: user.city,
              certifie: user.is_verified,
              secteur: user.is_farmer ? "Agriculteur" : 
                       user.is_store ? "Magasin/Boutique" : 
                       user.is_transformer ? "Entreprise de Transformation" : "Institution"
            };
            setAgriculteur(mappedAgri);
            localStorage.setItem('tracao_user', JSON.stringify(mappedAgri));
          } else {
            // Token invalide
            setAgriculteur(null);
            localStorage.removeItem('tracao_user');
            localStorage.removeItem('tracao_token');
          }
        } catch (e) {
          console.error("Error fetching profile from Django:", e);
        }
      } else {
        setAgriculteur(null);
        localStorage.removeItem('tracao_user');
      }
      setIsLoaded(true);
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    
    const isPublicPath = pathname === '/login' || pathname === '/register' || pathname === '/' || pathname?.startsWith('/magic-link') || pathname === '/verify';
    
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
  };

  const deconnecter = async () => {
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
    
    // Note: In a real app, you would also call a Django API here to save the profile
    console.log("Profil mis à jour localement. Synchro Django à implémenter si nécessaire.");
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
