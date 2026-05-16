"use client";

import { useLots } from "../../context/LotsContext";
import { getTypeProduitEmoji, getTypeProduitLabel, getStatutLabel } from "../../types";
import { TracaoBadge } from "../../components/ui/TracaoBadge";
import { PackageIcon, ArrowRightIcon, HistoryIcon, BarChart3Icon, FilterIcon } from "lucide-react";
import Link from "next/link";

export default function SuiviLotsScreen() {
  const { lots } = useLots();

  const getStatusProgress = (statut: string) => {
    switch (statut) {
      case 'enregistre': return 25;
      case 'transfere': return 50;
      case 'enTransformation': return 75;
      case 'exporte':
      case 'eudrConforme': return 100;
      default: return 0;
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-zinc-100 min-h-screen pb-24">
      {/* Header */}
      <div className="bg-tracao-cacao p-6 pt-12 text-white shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-black">Suivi des Lots</h1>
            <p className="text-sm text-white/60">Tracez le parcours de votre production</p>
          </div>
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
            <HistoryIcon size={24} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/15 rounded-2xl p-4">
            <p className="text-[10px] uppercase font-bold text-white/50 mb-1">En cours</p>
            <p className="text-xl font-black">{lots.filter(l => l.statut !== 'eudrConforme').length}</p>
          </div>
          <div className="bg-white/15 rounded-2xl p-4">
            <p className="text-[10px] uppercase font-bold text-white/50 mb-1">Conformes</p>
            <p className="text-xl font-black">{lots.filter(l => l.statut === 'eudrConforme').length}</p>
          </div>
        </div>
      </div>

      <div className="p-5 flex flex-col gap-4">
        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar">
          {['Tous', 'Cacao', 'Café', 'En attente', 'Terminé'].map((f) => (
            <button key={f} className="whitespace-nowrap px-4 py-2 bg-white border border-tracao-border-light rounded-xl text-xs font-bold text-tracao-choco hover:bg-tracao-cream-light transition-colors">
              {f}
            </button>
          ))}
        </div>

        {/* List of Lots for tracking */}
        <div className="flex flex-col gap-3">
          {lots.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 flex flex-col items-center justify-center text-center border border-dashed border-tracao-border">
              <div className="w-16 h-16 bg-tracao-cream-mid rounded-full flex items-center justify-center text-tracao-choco-pale mb-4">
                <PackageIcon size={32} />
              </div>
              <h3 className="font-bold text-tracao-choco">Aucun lot à suivre</h3>
              <p className="text-xs text-tracao-choco-pale mt-1">Vos lots apparaîtront ici après l'enregistrement.</p>
            </div>
          ) : (
            lots.map((lot) => {
              const progress = getStatusProgress(lot.statut);
              let badgeType: 'success' | 'warning' | 'error' | 'info' | 'neutral' = 'neutral';
              if (lot.statut === 'eudrConforme') badgeType = 'success';
              if (lot.statut === 'enregistre') badgeType = 'warning';
              if (lot.statut === 'transfere' || lot.statut === 'enTransformation') badgeType = 'info';

              return (
                <Link 
                  href={`/lot?id=${lot.lotId}`}
                  key={lot.id} 
                  className="bg-white rounded-2xl p-4 shadow-sm border border-tracao-border-light hover:shadow-md transition-all group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-tracao-cream-mid flex items-center justify-center text-xl">
                        {getTypeProduitEmoji(lot.typeProduit)}
                      </div>
                      <div>
                        <h3 className="font-black text-tracao-choco">{lot.lotId}</h3>
                        <p className="text-[10px] text-tracao-choco-pale uppercase font-bold tracking-wider">
                          {getTypeProduitLabel(lot.typeProduit)} · {lot.poidsKg} kg
                        </p>
                      </div>
                    </div>
                    <TracaoBadge label={getStatutLabel(lot.statut)} type={badgeType} />
                  </div>

                  {/* Progress Line */}
                  <div className="relative mt-2 mb-6">
                    <div className="h-1 w-full bg-tracao-cream-mid rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${lot.statut === 'eudrConforme' ? 'bg-tracao-forest' : 'bg-tracao-gold'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    {/* Dots for stages */}
                    <div className="absolute inset-0 flex justify-between -top-1">
                      {[0, 25, 50, 75, 100].map((p) => (
                        <div 
                          key={p} 
                          className={`w-3 h-3 rounded-full border-2 border-white shadow-sm ${progress >= p ? (lot.statut === 'eudrConforme' ? 'bg-tracao-forest' : 'bg-tracao-gold') : 'bg-tracao-border'}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-tracao-choco-pale uppercase font-bold px-1">
                    <span>Récolte</span>
                    <span>Transfert</span>
                    <span>Export</span>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
