"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLots } from "../../context/LotsContext";
import { Lot, getTypeProduitLabel, getStatutLabel } from "../../types";
import { ShieldCheckIcon, MaximizeIcon, Share2Icon, DownloadIcon, CheckCircle2Icon } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

function LotDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { trouverParId } = useLots();
  
  const id = searchParams.get("id");
  const [lot, setLot] = useState<Lot | null>(null);

  useEffect(() => {
    if (id) {
      const found = trouverParId(id);
      if (found) setLot(found);
    }
  }, [id, trouverParId]);

  if (!lot) return <div className="p-6 text-tracao-choco font-bold">Chargement du lot...</div>;

  const dateStr = new Date(lot.dateEnregistrement).toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric"
  });

  const timelineSteps = [
    { label: "Ferme", done: true },
    { label: "Coopérative", done: ['transfere', 'enTransformation', 'exporte', 'eudrConforme'].includes(lot.statut) },
    { label: "Transformation", done: ['enTransformation', 'exporte', 'eudrConforme'].includes(lot.statut) },
    { label: "Exportation", done: ['exporte', 'eudrConforme'].includes(lot.statut) }
  ];

  // Helper for generating dummy libellé and season based on current year if needed
  const anneeCourante = new Date().getFullYear();
  const libelle = lot.agriculteurNom ? `Lot de ${lot.agriculteurNom.split(' ')[0]}` : "Lot Standard";
  const parcelle = lot.farmId ? `Ferme #${lot.farmId}` : "Parcelle Centrale";
  const saison = `${anneeCourante} - ${anneeCourante + 1}`;

  return (
    <div className="flex flex-col flex-1 bg-[#8C8075]/30 h-screen overflow-y-auto p-4 lg:p-10 flex items-center justify-center">
      
      {/* Modal Card */}
      <div className="bg-white w-full max-w-2xl rounded-3xl p-6 lg:p-8 shadow-2xl">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-[#4A3018] font-bold text-lg">Détails d'un lot</h1>
          <button className="text-[#4A3018]/50 hover:text-[#4A3018] transition-colors">
            <MaximizeIcon size={20} />
          </button>
        </div>

        {/* Top Info Section (Grey Card) */}
        <div className="bg-[#F5F5F5] rounded-2xl p-4 lg:p-6 flex flex-col md:flex-row gap-4 lg:gap-6 mb-6 relative">
          {/* QR Code */}
          <div className="bg-white p-2 rounded-xl shrink-0">
            <QRCodeSVG 
              value={`${window.location.origin}/verify?batch=${lot.lotId}`} 
              size={100} 
              level="H"
              fgColor="#4A3018"
              bgColor="#ffffff"
            />
          </div>
          
          {/* Middle Info */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="inline-flex items-center gap-1.5 bg-[#E8E8E8] text-[#4A3018] px-3 py-1 rounded-full text-xs font-bold w-max mb-3">
              <ShieldCheckIcon size={14} className="text-[#4A3018]" />
              {getStatutLabel(lot.statut)}
            </div>
            <p className="text-[#4A3018] font-bold text-sm lg:text-base break-all mb-1">{lot.lotId}</p>
            <p className="text-[10px] text-[#4A3018]/60 font-semibold uppercase">Généré le {dateStr}</p>
          </div>

          {/* Action Buttons */}
          <div className="absolute top-4 right-4 md:static flex flex-row md:flex-col gap-2">
            <button className="w-8 h-8 lg:w-10 lg:h-10 bg-[#E8E8E8] text-[#4A3018] rounded-lg flex items-center justify-center hover:bg-[#D8D8D8] transition-colors">
              <Share2Icon size={16} />
            </button>
            <button className="w-8 h-8 lg:w-10 lg:h-10 bg-[#E8E8E8] text-[#4A3018] rounded-lg flex items-center justify-center hover:bg-[#D8D8D8] transition-colors">
              <DownloadIcon size={16} />
            </button>
          </div>
        </div>

        {/* Fields List */}
        <div className="space-y-3 mb-8">
          <div className="bg-[#F5F5F5] rounded-xl px-5 py-4 flex justify-between items-center text-[#4A3018]">
            <span className="text-sm font-semibold opacity-70">Libellé :</span>
            <span className="text-sm font-bold">{libelle}</span>
          </div>
          <div className="bg-[#F5F5F5] rounded-xl px-5 py-4 flex justify-between items-center text-[#4A3018]">
            <span className="text-sm font-semibold opacity-70">Parcelle :</span>
            <span className="text-sm font-bold">{parcelle}</span>
          </div>
          <div className="bg-[#F5F5F5] rounded-xl px-5 py-4 flex justify-between items-center text-[#4A3018]">
            <span className="text-sm font-semibold opacity-70">Choix culture :</span>
            <span className="text-sm font-bold">{getTypeProduitLabel(lot.typeProduit)}</span>
          </div>
          <div className="bg-[#F5F5F5] rounded-xl px-5 py-4 flex justify-between items-center text-[#4A3018]">
            <span className="text-sm font-semibold opacity-70">Saison :</span>
            <span className="text-sm font-bold">{saison}</span>
          </div>
          <div className="bg-[#F5F5F5] rounded-xl px-5 py-4 flex justify-between items-center text-[#4A3018]">
            <span className="text-sm font-semibold opacity-70">Quantité estimé :</span>
            <span className="text-sm font-bold">{lot.poidsKg} Kg</span>
          </div>
        </div>

        {/* Horizontal Timeline */}
        <div className="mb-8 px-2">
          <h3 className="text-xs font-bold text-[#4A3018] uppercase mb-6 opacity-70">Trajet du lot</h3>
          <div className="relative flex justify-between items-center">
            {/* Background Line */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-[#E8E8E8] rounded-full z-0" />
            
            {/* Progress Line */}
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#4A3018] rounded-full z-0 transition-all duration-500" 
              style={{ width: `${Math.max(0, (timelineSteps.filter(s => s.done).length - 1)) / (timelineSteps.length - 1) * 100}%` }}
            />
            
            {/* Dots */}
            {timelineSteps.map((step, idx) => (
              <div key={idx} className="relative z-10 flex flex-col items-center">
                <div className={`w-5 h-5 rounded-full border-4 border-white shadow-sm flex items-center justify-center transition-all duration-300 ${
                  step.done ? 'bg-[#4A3018]' : 'bg-[#E8E8E8]'
                }`}>
                  {step.done && <CheckCircle2Icon size={10} className="text-white absolute" />}
                </div>
                <span className={`absolute top-8 text-[10px] font-bold text-center w-20 -ml-10 ${
                  step.done ? 'text-[#4A3018]' : 'text-[#4A3018]/40'
                }`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end mt-12">
          <button 
            onClick={() => router.back()}
            className="bg-[#F5F5F5] text-[#4A3018] font-bold px-6 py-3 rounded-2xl hover:bg-[#E8E8E8] transition-colors"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
}

export default function DetailLotScreen() {
  return (
    <Suspense fallback={<div className="p-6 text-tracao-choco font-bold">Chargement...</div>}>
      <LotDetailContent />
    </Suspense>
  );
}
