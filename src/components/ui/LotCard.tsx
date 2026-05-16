"use client";

import Link from "next/link";
import { Lot, getTypeProduitLabel, getStatutLabel } from "../../types";
import { LeafIcon, QrCodeIcon } from "lucide-react";

export function LotCard({ lot }: { lot: Lot }) {
  const currentYear = new Date(lot.dateEnregistrement).getFullYear();
  const seasonStr = `${currentYear}/${currentYear + 1}`;
  
  // Status styling logic
  let statusColor = "bg-white/20 text-white/80";
  const statusLabel = getStatutLabel(lot.statut);
  if (lot.statut === 'enregistre' || lot.statut === 'en_attente_magasinier') {
    statusColor = "bg-amber-500/20 text-amber-300";
  } else if (lot.statut === 'eudrConforme' || lot.statut === 'transfere') {
    statusColor = "bg-tracao-forest/20 text-tracao-forest";
  }

  return (
    <Link
      href={`/lot?id=${lot.lotId}`}
      className="block w-full max-w-full bg-[#FAF9F6] border border-tracao-border-light rounded-2xl p-4 shadow-sm hover:shadow-md hover:scale-[1.005] transition-all"
    >
      {/* Header: Lot ID and Parcelle */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2 text-tracao-choco font-semibold">
          <LeafIcon size={16} className="text-tracao-choco-pale" />
          <span>{lot.lotId}</span>
          <span className="text-tracao-choco-pale text-xs mx-1">•</span>
          <span className="text-tracao-choco-pale text-xs">Parcelle {lot.farmId || "B"}</span>
        </div>
        <div className="text-tracao-choco-pale cursor-pointer hover:text-tracao-choco transition-colors">
          <QrCodeIcon size={18} />
        </div>
      </div>

      {/* Inner Brown Card */}
      <div className="bg-gradient-to-br from-[#4A3018] to-[#3B2512] rounded-xl overflow-hidden p-4 shadow-inner">
        {/* Inner Header: Type and Season */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-white font-bold text-sm">
            {getTypeProduitLabel(lot.typeProduit)}
            <span className="text-white/50 text-xs mx-1.5">•</span>
            <span className="text-white/60 text-xs font-medium">{seasonStr}</span>
          </div>
          <div className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${statusColor}`}>
            • {statusLabel}
          </div>
        </div>

        {/* Quantities Grid */}
        <div className="grid grid-cols-2 divide-x divide-white/10 border border-white/10 rounded-lg">
          <div className="p-2.5 lg:p-3">
            <p className="text-[10px] text-white/50 mb-1">Qte estimé</p>
            <p className="text-lg lg:text-xl font-bold text-[#E2A856]">{lot.poidsKg} <span className="text-sm font-medium">Kg</span></p>
          </div>
          <div className="p-2.5 lg:p-3">
            <p className="text-[10px] text-white/50 mb-1">Qte recolté</p>
            <p className="text-lg lg:text-xl font-bold text-white/90">--- <span className="text-sm font-medium">Kg</span></p>
          </div>
        </div>
      </div>
    </Link>
  );
}
