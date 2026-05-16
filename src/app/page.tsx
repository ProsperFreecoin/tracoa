"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAgriculteur } from "../context/AgriculteurContext";
import { useLots } from "../context/LotsContext";
import { LotCard } from "../components/ui/LotCard";
import LandingPage from "../components/LandingPage";
import { PlusCircleIcon, QrCodeIcon, ListIcon, BarChart2Icon, HelpCircleIcon, CheckCircle2Icon, TrendingUpIcon, BellIcon, LeafIcon, MapPinIcon, ArrowRightIcon, ShieldCheckIcon, EyeIcon, XIcon } from "lucide-react";

export default function DashboardScreen() {
  const router = useRouter();
  const { agriculteur, estConnecte } = useAgriculteur();
  const { totalLots, totalPoidsKg, lotsSyncronises, lotsRecents, lotsExportes } = useLots();
  
  const [showEUDR, setShowEUDR] = useState(false);

  useEffect(() => {
    if (estConnecte && agriculteur) {
      if (agriculteur.secteur === "Coopérative" || agriculteur.secteur === "Magasinier" || agriculteur.secteur === "Magasin/Boutique") {
        router.push("/cooperative");
      } else if (agriculteur.secteur === "Acheteur Privé") {
        router.push("/acheteur");
      } else if (agriculteur.secteur === "Entreprise de Transformation") {
        router.push("/importateur");
      } else if (agriculteur.secteur === "Institution") {
        router.push("/gouvernement");
      } else if (agriculteur.secteur === "Certificateur") {
        router.push("/certificateur");
      }
    }
  }, [estConnecte, agriculteur, router]);

  if (!estConnecte) {
    return <LandingPage />;
  }

  if (!agriculteur) return null;

  const dateStr = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  }).format(new Date());

  return (
    <div className="flex flex-col flex-1 pb-10 bg-[#FAF9F6] lg:bg-[#FAF9F6] min-h-screen overflow-y-auto px-5 lg:px-8 pt-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-tracao-choco tracking-tight">
            Bonjour, {agriculteur.prenom} {agriculteur.nom}
          </h1>
          <p className="text-sm text-tracao-choco-light mt-1">Bienvenue sur votre espace de gestion</p>
        </div>
        <div className="flex items-center gap-3">
          {agriculteur.kycStatut !== 'verifie' && (
            <Link href="/profil" className="hidden lg:flex items-center gap-2 px-4 py-2.5 bg-tracao-cream-mid border border-tracao-border rounded-xl text-tracao-choco font-bold text-sm hover:bg-tracao-cream-dark transition-colors">
              <ShieldCheckIcon size={16} className="text-tracao-choco-pale" />
              Compléter mon KYC
            </Link>
          )}
          <Link href="/profil" className="w-12 h-12 bg-tracao-cacao rounded-xl flex items-center justify-center text-white cursor-pointer shadow-md hover:bg-tracao-choco-mid transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m13 2-2 2.5-2-2.5-2 2.5-2-2.5v18h14V2z"/><path d="M9 16v-5"/><path d="M15 16v-3"/></svg>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Card 1: Lots */}
        <div className="bg-gradient-to-br from-[#4A3018] to-[#6A4524] rounded-[2rem] p-8 text-white shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[180px]">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
          <div className="flex justify-between items-start mb-8 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#4A3018]">
                <LeafIcon size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg">Total des lots</h3>
                <p className="text-xs text-white/60">Gestion globale de vos récoltes</p>
              </div>
            </div>
            <div className="text-white/50">•••</div>
          </div>
          <div className="relative z-10">
            <div className="flex items-end gap-3 mb-4">
              <span className="text-4xl font-black">{totalLots} Lots</span>
              <span className="text-[11px] bg-white text-[#4A3018] font-bold px-3 py-1 rounded-full mb-1">
                {lotsSyncronises} Lots validés
              </span>
            </div>
            <Link href="/mes-lots" className="text-sm font-semibold text-white/80 flex justify-between items-center hover:text-white transition-colors">
              Voir la liste complète <ArrowRightIcon size={16} />
            </Link>
          </div>
        </div>

        {/* Card 2: Statistiques Poids */}
        <div className="bg-white border border-tracao-border-light rounded-[2rem] p-8 text-tracao-choco shadow-sm flex flex-col justify-between min-h-[180px]">
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-tracao-cream-mid rounded-2xl flex items-center justify-center text-tracao-choco-pale">
                <BarChart2Icon size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg">Total Récolté</h3>
                <p className="text-xs text-tracao-choco-pale">Volume total de votre production</p>
              </div>
            </div>
            <div className="text-tracao-choco-pale">•••</div>
          </div>
          <div>
            <div className="mb-4">
              <span className="text-4xl font-black">{totalPoidsKg.toFixed(1)} <span className="text-xl font-bold text-tracao-choco-light">Kg</span></span>
            </div>
            <div className="text-sm font-semibold text-tracao-choco-pale flex justify-between items-center">
              Détails de production <TrendingUpIcon size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* Statuts des lots */}
      <div className="bg-white border border-tracao-border-light rounded-[3rem] p-8 shadow-sm mb-10">
        <h3 className="text-lg font-bold text-tracao-choco mb-6 flex items-center gap-2">
          <ClockIcon size={20} className="text-tracao-cacao" /> Suivi de vos lots
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Prêt */}
          <div className="flex flex-col items-center justify-center text-center p-6 bg-tracao-cream-light/50 rounded-3xl border border-tracao-border-light">
            <div className="w-12 h-12 rounded-2xl border-2 border-tracao-forest text-tracao-forest flex items-center justify-center mb-3">
              <CheckCircle2Icon size={24} />
            </div>
            <p className="text-base font-bold text-tracao-choco">Lots {totalLots}</p>
            <p className="text-xs text-tracao-choco-light mt-1">Prêt pour la récolte</p>
            <Link href="/mes-lots" className="mt-4 px-6 py-2 bg-white border border-tracao-border text-tracao-choco-pale text-xs font-bold rounded-full hover:bg-tracao-cream-mid transition-colors">Voir</Link>
          </div>
          
          {/* Non validé */}
          <div className="flex flex-col items-center justify-center text-center p-6 bg-tracao-cream-light/50 rounded-3xl border border-tracao-border-light">
            <div className="w-12 h-12 rounded-2xl border-2 border-tracao-error text-tracao-error flex items-center justify-center mb-3">
              <XIcon size={24} />
            </div>
            <p className="text-base font-bold text-tracao-choco">0 Lot rejeté</p>
            <p className="text-xs text-tracao-choco-light mt-1">Aucune anomalie détectée</p>
            <button className="mt-4 px-6 py-2 bg-white border border-tracao-border text-tracao-choco-pale text-xs font-bold rounded-full opacity-50 cursor-not-allowed">Revérifier</button>
          </div>

          {/* En attente */}
          <div className="flex flex-col items-center justify-center text-center p-6 bg-tracao-cream-light/50 rounded-3xl border border-tracao-border-light">
            <div className="w-12 h-12 rounded-2xl border-2 border-amber-400 text-amber-500 flex items-center justify-center mb-3">
              <ClockIcon size={24} />
            </div>
            <p className="text-base font-bold text-tracao-choco">{totalLots - lotsSyncronises} En attente</p>
            <p className="text-xs text-tracao-choco-light mt-1">Vérification par magasin</p>
            <Link href="/mes-lots" className="mt-4 px-6 py-2 bg-white border border-tracao-border text-tracao-choco-pale text-xs font-bold rounded-full hover:bg-tracao-cream-mid transition-colors">Suivre</Link>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <Link href="/mes-lots" className="px-8 py-4 bg-tracao-cacao text-white rounded-2xl font-bold text-base flex items-center gap-3 hover:bg-tracao-choco-mid transition-all shadow-lg hover:shadow-tracao-cacao/20">
            <ListIcon size={20} /> Accéder à tous mes lots
          </Link>
        </div>
      </div>

      </div>
    </div>
  );
}

function StatCard({ label, value, icon, className = "" }: { label: string; value: string; icon: string; className?: string }) {
  return (
    <div className={`bg-white/20 backdrop-blur-sm rounded-xl p-3 flex flex-col justify-center items-center gap-1 ${className}`}>
      <span className="text-lg">{icon}</span>
      <span className="text-xl lg:text-2xl font-black text-white">{value}</span>
      <span className="text-[9px] text-white/60 uppercase font-semibold text-center leading-tight">{label}</span>
    </div>
  );
}

function QuickAction({ icon, label, onClick, href }: { icon: React.ReactNode; label: string; onClick?: () => void; href?: string }) {
  const content = (
    <div className="bg-white border border-tracao-border-light rounded-xl py-3 flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:bg-tracao-cream hover:border-tracao-cacao transition-all h-full">
      <div className="text-tracao-cacao">{icon}</div>
      <span className="text-[9px] font-semibold text-tracao-choco-light text-center leading-tight">{label}</span>
    </div>
  );

  if (href) {
    return <Link href={href} className="flex flex-col">{content}</Link>;
  }

  return (
    <div onClick={onClick} className="flex flex-col">
      {content}
    </div>
  );
}


