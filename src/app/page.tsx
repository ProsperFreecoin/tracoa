"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAgriculteur } from "../context/AgriculteurContext";
import { useLots } from "../context/LotsContext";
import { LotCard } from "../components/ui/LotCard";
import LandingPage from "../components/LandingPage";
import { PlusCircleIcon, QrCodeIcon, ListIcon, BarChart2Icon, HelpCircleIcon, CheckCircle2Icon, TrendingUpIcon, BellIcon } from "lucide-react";

export default function DashboardScreen() {
  const router = useRouter();
  const { agriculteur, estConnecte } = useAgriculteur();
  const { totalLots, totalPoidsKg, lotsSyncronises, lotsRecents, lotsExportes } = useLots();
  
  const [showEUDR, setShowEUDR] = useState(false);

  useEffect(() => {
    if (estConnecte && agriculteur?.secteur === "Coopérative") {
      router.push("/cooperative");
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
    <div className="flex flex-col flex-1 pb-10 bg-tracao-cream lg:bg-zinc-100 overflow-y-auto">
      {/* Header */}
      <div className="bg-tracao-cacao lg:rounded-2xl lg:m-6 lg:mb-0 p-6 pt-10 lg:pt-8 text-white shadow-md relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-xs text-white/50 uppercase tracking-widest font-semibold mb-1">{dateStr}</p>
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">Bonjour, {agriculteur.prenom}</h1>
            <p className="text-xs text-white/60 mt-1 capitalize">{agriculteur.secteur || agriculteur.region || "Agriculteur"}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/profil" className="relative p-2.5 bg-white/10 rounded-full hover:bg-white/20 transition-colors cursor-pointer">
              <BellIcon size={20} className="text-white" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-tracao-error rounded-full border-2 border-tracao-cacao"></span>
            </Link>
            <Link href="/profil" className="w-11 h-11 rounded-full bg-tracao-gold flex items-center justify-center text-tracao-choco font-black text-lg shadow-md cursor-pointer overflow-hidden hover:scale-105 transition-transform">
              {agriculteur.photoUrl ? (
                <img src={agriculteur.photoUrl} alt="Profil" className="w-full h-full object-cover" />
              ) : (
                agriculteur.prenom.charAt(0).toUpperCase()
              )}
            </Link>
          </div>
        </div>

        {/* Stats grid - 4 cols on desktop */}
        <div className="grid grid-cols-3 lg:grid-cols-4 gap-2 lg:gap-3">
          <StatCard label="Lots actifs" value={totalLots.toString()} icon="📦" />
          <StatCard label="Kg enregistrés" value={`${totalPoidsKg.toFixed(0)} kg`} icon="⚖️" />
          <StatCard label="Sur blockchain" value={`${lotsSyncronises}/${totalLots}`} icon="🔗" />
          <StatCard label="Exportés" value={lotsExportes.toString()} icon="✈️" className="hidden lg:flex" />
        </div>
      </div>

      {/* 2-col grid on desktop */}
      <div className="p-5 lg:p-6 mt-2 grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left col */}
        <div className="flex flex-col gap-6">
          {/* CTA Nouveau lot */}
          <Link href="/nouveau-lot" className="block w-full p-5 rounded-2xl bg-gradient-to-br from-tracao-cacao to-tracao-choco-mid shadow-lg text-white hover:scale-[1.01] transition-transform">
            <div className="flex items-center">
              <PlusCircleIcon size={30} className="text-tracao-gold mr-3 shrink-0" />
              <div className="flex-1">
                <h3 className="font-bold text-sm lg:text-base">Enregistrer un nouveau lot</h3>
                <p className="text-[11px] text-white/70 mt-0.5">Saisie terrain · GPS automatique · Blockchain</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50 shrink-0"><path d="m9 18 6-6-6-6"/></svg>
            </div>
          </Link>

          {/* Quick actions */}
          <div>
            <h2 className="text-sm font-bold text-tracao-choco mb-3">Accès rapides</h2>
            <div className="grid grid-cols-4 gap-2">
              <QuickAction icon={<QrCodeIcon size={22} />} label="Vérifier" href="/scanner" />
              <QuickAction icon={<ListIcon size={22} />} label="Mes lots" href="/mes-lots" />
              <QuickAction icon={<BarChart2Icon size={22} />} label="Bilan" />
              <QuickAction icon={<HelpCircleIcon size={22} />} label="EUDR" onClick={() => setShowEUDR(true)} />
            </div>
          </div>

          {/* EUDR Banner */}
          <div className="bg-tracao-forest-light border border-[#B8D8A0] rounded-xl p-4 flex items-start gap-3">
            <CheckCircle2Icon className="text-tracao-forest shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className="text-xs font-bold text-tracao-forest">Conformité EUDR active</h4>
              <p className="text-[10px] text-tracao-forest/80 mt-1 leading-snug">Vos lots enregistrés avec GPS sont conformes au règlement européen anti-déforestation.</p>
            </div>
          </div>
        </div>

        {/* Right col: Lots récents */}
        <div>
          <div className="flex justify-between items-end mb-3">
            <h2 className="text-sm font-bold text-tracao-choco">Derniers lots enregistrés</h2>
            <Link href="/mes-lots" className="text-[11px] font-bold text-tracao-cacao uppercase">Voir tout</Link>
          </div>
          
          {lotsRecents.length === 0 ? (
            <div className="bg-tracao-cream-mid p-8 rounded-xl text-center border border-tracao-border-light">
              <p className="text-4xl mb-3">📭</p>
              <p className="text-sm font-bold text-tracao-choco-light">Aucun lot enregistré.</p>
              <p className="text-xs text-tracao-choco-pale mt-1">Appuyez sur "Nouveau lot" pour commencer.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 overflow-hidden">
              {lotsRecents.slice(0, 1).map(lot => (
                <LotCard key={lot.id} lot={lot} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* EUDR Modal */}
      {showEUDR && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end lg:items-center justify-center">
          <div className="bg-tracao-cream-light w-full max-w-md rounded-t-2xl lg:rounded-2xl p-6">
            <h3 className="text-lg font-extrabold text-tracao-choco mb-3">📋 Règlement EUDR</h3>
            <p className="text-sm text-tracao-choco-light leading-relaxed mb-5">
              Le règlement européen EUDR (2025) exige une traçabilité géographique prouvée pour tout cacao et café importé dans l'Union Européenne.<br/><br/>
              Grâce à Tracao, chaque lot que vous enregistrez avec vos coordonnées GPS est automatiquement conforme à cette exigence.
            </p>
            <button onClick={() => setShowEUDR(false)} className="w-full py-3.5 bg-tracao-cacao text-white rounded-lg font-bold hover:bg-tracao-choco-mid transition-colors">
              Compris
            </button>
          </div>
        </div>
      )}
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


