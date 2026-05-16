"use client";

import { useAgriculteur } from "../../context/AgriculteurContext";
import { ArrowRightIcon, ShieldCheckIcon, AwardIcon, FileSearchIcon, ClockIcon } from "lucide-react";
import Link from "next/link";

export default function CertificateurDashboard() {
  const { agriculteur } = useAgriculteur();

  if (!agriculteur) return null;

  return (
    <div className="flex flex-col flex-1 pb-10 bg-[#FAF9F6] lg:bg-[#FAF9F6] min-h-screen overflow-y-auto px-5 lg:px-8 pt-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-tracao-choco tracking-tight">
            Portail Certificateur
          </h1>
          <p className="text-sm text-tracao-choco-light mt-1">
            {agriculteur.nom || agriculteur.prenom || "Cabinet d'Audit Indépendant"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {agriculteur.kycStatut !== 'verifie' && (
            <Link href="/profil" className="hidden lg:flex items-center gap-2 px-4 py-2.5 bg-tracao-cream-mid border border-tracao-border rounded-xl text-tracao-choco font-bold text-sm hover:bg-tracao-cream-dark transition-colors">
              <ShieldCheckIcon size={16} className="text-tracao-error" />
              Compte non vérifié
            </Link>
          )}
          <Link href="/profil" className="w-12 h-12 bg-tracao-cacao rounded-xl flex items-center justify-center text-white cursor-pointer shadow-md hover:bg-tracao-choco-mid transition-colors font-bold">
            <AwardIcon size={20} />
          </Link>
        </div>
      </div>

      {/* 3 Horizontal Cards */}
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar">
        {/* Card 1: En attente */}
        <div className="min-w-[280px] lg:min-w-[320px] bg-gradient-to-br from-[#4A3018] to-[#6A4524] rounded-[2rem] p-6 text-white shadow-lg relative overflow-hidden snap-start shrink-0 flex flex-col justify-between">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
          <div className="flex justify-between items-start mb-8 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#4A3018]">
                <ClockIcon size={20} />
              </div>
              <div>
                <h3 className="font-bold text-base">Dossiers en attente</h3>
                <p className="text-[10px] text-white/60">Demandes de certification</p>
              </div>
            </div>
            <div className="text-white/50">•••</div>
          </div>
          <div className="relative z-10">
            <div className="flex items-end gap-3 mb-4">
              <span className="text-3xl font-black">24</span>
              <span className="text-[10px] bg-amber-500 text-white font-bold px-2 py-0.5 rounded-full mb-1">
                Priorité Haute
              </span>
            </div>
            <Link href="#" className="text-sm font-semibold text-white/80 flex justify-between items-center hover:text-white transition-colors">
              Commencer l'audit <ArrowRightIcon size={16} />
            </Link>
          </div>
        </div>

        {/* Card 2: Audits Réalisés */}
        <div className="min-w-[280px] lg:min-w-[320px] bg-white border border-tracao-border-light rounded-[2rem] p-6 text-tracao-choco shadow-sm snap-start shrink-0 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-tracao-cream-mid rounded-xl flex items-center justify-center text-tracao-choco-pale">
                <FileSearchIcon size={20} />
              </div>
              <div>
                <h3 className="font-bold text-base">Audits Réalisés</h3>
                <p className="text-[10px] text-tracao-choco-pale">Sur le terrain et documentaire</p>
              </div>
            </div>
          </div>
          <div>
            <div className="mb-4">
              <span className="text-3xl font-black">156 <span className="text-lg font-bold text-tracao-choco-light">audits</span></span>
            </div>
            <div className="text-sm font-semibold text-tracao-forest">
              98% de conformité
            </div>
          </div>
        </div>

        {/* Card 3: Certificats émis */}
        <div className="min-w-[280px] lg:min-w-[320px] bg-white border border-tracao-border-light rounded-[2rem] p-6 text-tracao-choco shadow-sm snap-start shrink-0 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-tracao-cream-mid rounded-xl flex items-center justify-center text-tracao-choco-pale">
                <AwardIcon size={20} />
              </div>
              <div>
                <h3 className="font-bold text-base">Certificats Émis</h3>
                <p className="text-[10px] text-tracao-choco-pale">Validés sur la Blockchain</p>
              </div>
            </div>
          </div>
          <div>
            <div className="mb-4">
              <span className="text-3xl font-black">142 <span className="text-lg font-bold text-tracao-choco-light">certificats</span></span>
            </div>
            <div className="text-sm font-semibold text-tracao-choco-pale flex justify-between items-center">
              Gérer les certificats <ArrowRightIcon size={16} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center text-tracao-choco-pale">
        <p>Interface Certificateur en cours de développement...</p>
      </div>
    </div>
  );
}
