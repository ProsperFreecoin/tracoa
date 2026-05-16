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

      {/* 3 Horizontal Cards */}
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar">
        {/* Card 1: Lots */}
        <div className="min-w-[280px] lg:min-w-[320px] bg-gradient-to-br from-[#4A3018] to-[#6A4524] rounded-[2rem] p-6 text-white shadow-lg relative overflow-hidden snap-start shrink-0 flex flex-col justify-between">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
          <div className="flex justify-between items-start mb-8 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#4A3018]">
                <LeafIcon size={20} />
              </div>
              <div>
                <h3 className="font-bold text-base">Total des lots</h3>
                <p className="text-[10px] text-white/60">Tous vos lots que vous avez crées</p>
              </div>
            </div>
            <div className="text-white/50">•••</div>
          </div>
          <div className="relative z-10">
            <div className="flex items-end gap-3 mb-4">
              <span className="text-3xl font-black">{totalLots} Lots</span>
              <span className="text-[10px] bg-white text-[#4A3018] font-bold px-2 py-0.5 rounded-full mb-1">
                {lotsSyncronises} Lots validés
              </span>
            </div>
            <Link href="/mes-lots" className="text-sm font-semibold text-white/80 flex justify-between items-center hover:text-white transition-colors">
              Voir les détails <ArrowRightIcon size={16} />
            </Link>
          </div>
        </div>

        {/* Card 2: Parcelles */}
        <div className="min-w-[280px] lg:min-w-[320px] bg-white border border-tracao-border-light rounded-[2rem] p-6 text-tracao-choco shadow-sm snap-start shrink-0 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-tracao-cream-mid rounded-xl flex items-center justify-center text-tracao-choco-pale">
                <MapPinIcon size={20} />
              </div>
              <div>
                <h3 className="font-bold text-base">Mes parcelles</h3>
                <p className="text-[10px] text-tracao-choco-pale">Une vue directe sur vos parcelles</p>
              </div>
            </div>
            <div className="text-tracao-choco-pale">•••</div>
          </div>
          <div>
            <div className="mb-4">
              <span className="text-3xl font-black">1 <span className="text-lg font-bold text-tracao-choco-light">parcelle / 200 Ha</span></span>
            </div>
            <div className="text-sm font-semibold text-tracao-choco-pale flex justify-between items-center">
              Visiter sur la carte <MapPinIcon size={16} />
            </div>
          </div>
        </div>

        {/* Card 3: Productions */}
        <div className="min-w-[280px] lg:min-w-[320px] bg-white border border-tracao-border-light rounded-[2rem] p-6 text-tracao-choco shadow-sm snap-start shrink-0 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-tracao-cream-mid rounded-xl flex items-center justify-center text-tracao-choco-pale">
                <BarChart2Icon size={20} />
              </div>
              <div>
                <h3 className="font-bold text-base">Productions</h3>
                <p className="text-[10px] text-tracao-choco-pale">Où en êtes vous sur vos récoltes</p>
              </div>
            </div>
            <div className="text-tracao-choco-pale">•••</div>
          </div>
          <div>
            <div className="mb-4">
              <span className="text-3xl font-black">{totalPoidsKg.toFixed(0)} <span className="text-lg font-bold text-tracao-choco-light">Kg</span></span>
            </div>
            <div className="text-sm font-semibold text-tracao-choco-pale flex justify-between items-center">
              Visiter sur la carte <MapPinIcon size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Statuts & Map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-2 mb-10">
        
        {/* Statuts des lots */}
        <div className="lg:col-span-2 bg-white border border-tracao-border-light rounded-[2rem] p-6 shadow-sm">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 h-full">
            {/* Prêt */}
            <div className="flex flex-col items-center justify-center text-center p-4 border-r border-b border-tracao-border-light">
              <div className="w-8 h-8 rounded-full border-2 border-tracao-forest text-tracao-forest flex items-center justify-center mb-2">
                <CheckCircle2Icon size={16} />
              </div>
              <p className="text-sm font-bold text-tracao-choco">Lots {totalLots}</p>
              <p className="text-xs text-tracao-choco-light mt-1">Prêt pour la recolte</p>
              <button className="mt-4 px-4 py-1.5 bg-tracao-cream-mid text-tracao-choco-pale text-xs font-bold rounded-full">Voir</button>
            </div>
            
            {/* Non validé */}
            <div className="flex flex-col items-center justify-center text-center p-4 border-b border-tracao-border-light lg:border-r">
              <div className="w-8 h-8 rounded-full border-2 border-tracao-error text-tracao-error flex items-center justify-center mb-2">
                <XIcon size={16} />
              </div>
              <p className="text-sm font-bold text-tracao-choco">Lots 0</p>
              <p className="text-xs text-tracao-choco-light mt-1">Lot non validé</p>
              <button className="mt-4 px-4 py-1.5 bg-tracao-cream-mid text-tracao-choco-pale text-xs font-bold rounded-full">Revérifier</button>
            </div>

            {/* En attente */}
            <div className="flex flex-col items-center justify-center text-center p-4 border-r border-tracao-border-light lg:border-r-0 lg:border-b-0">
              <p className="text-sm font-bold text-tracao-choco">L001</p>
              <p className="text-xs text-tracao-choco-light mt-1">En attente</p>
              <Link href="/mes-lots" className="mt-4 text-xs font-bold text-tracao-cacao underline">Voir</Link>
            </div>

            {/* Voir tous les lots */}
            <div className="flex items-center justify-center p-4 col-span-2 lg:col-span-1 lg:row-span-2">
              <Link href="/mes-lots" className="px-6 py-3 bg-[#4A3018] text-white rounded-full font-bold text-sm flex items-center gap-2 hover:bg-[#6A4524] transition-colors shadow-md">
                <EyeIcon size={16} /> Voir tous les lots
              </Link>
            </div>
          </div>
        </div>

        {/* Map Placeholder */}
        <div className="bg-white border border-tracao-border-light rounded-[2rem] p-4 shadow-sm relative overflow-hidden min-h-[250px]">
          <div className="absolute inset-0 bg-[#F5F5F5] opacity-50 flex items-center justify-center">
            {/* Simple static map representation */}
            <div className="relative w-full h-full flex items-center justify-center">
              <svg viewBox="0 0 200 200" className="w-full h-full max-w-[200px] text-[#E0E0E0] fill-current">
                <path d="M10,50 L80,20 L150,60 L180,120 L140,180 L50,160 Z" />
              </svg>
              {/* Highlighted parcel */}
              <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full max-w-[200px] text-[#2C4A1D] fill-current mx-auto shadow-xl" style={{ transform: 'translate(20px, 30px) scale(0.6)'}}>
                <path d="M20,60 L90,40 L160,80 L140,150 L40,130 Z" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center pt-8 pr-4">
                <span className="text-white text-xs font-black tracking-widest drop-shadow-md">Parcelle 1</span>
              </div>
            </div>
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


