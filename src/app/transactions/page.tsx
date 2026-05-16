"use client";

import { useState } from "react";
import { useLots } from "../../context/LotsContext";
import { Lot } from "../../types";
import { SearchIcon, DownloadIcon, CheckCircle2Icon, CircleIcon, LinkIcon, CopyIcon, XIcon, ArrowRightLeftIcon } from "lucide-react";

export default function TransactionsPage() {
  const { lots } = useLots();
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null);

  // Pour la page transactions, on affiche tous les lots.
  // Vous pourrez affiner si vous ne voulez que ceux vendus.
  const transactions = lots;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copié !");
  };

  return (
    <div className="p-6 lg:p-10 flex flex-col gap-8 flex-1 h-screen overflow-y-auto bg-white text-[#4A3018]">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-black mb-1">Listes des transactions</h1>
        <p className="text-sm opacity-60 font-semibold">Cette section donne un accès en lecture uniquement sur les transactions effectuées</p>
      </div>

      {/* Barre de recherche (si besoin, comme sur l'image) */}
      <div className="flex justify-end">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Rechercher..."
            className="pl-10 pr-4 py-2 bg-[#F5F5F5] rounded-xl outline-none focus:ring-1 focus:ring-[#4A3018] text-sm"
          />
          <SearchIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50" />
        </div>
      </div>

      {/* Tableau des transactions */}
      <div className="bg-[#F5F5F5] rounded-2xl overflow-hidden border border-[#E8E8E8]">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-[#E8E8E8] font-bold">
            <tr>
              <th className="px-6 py-4 rounded-tl-2xl">Date</th>
              <th className="px-6 py-4">Statut</th>
              <th className="px-6 py-4">Quantité vendue</th>
              <th className="px-6 py-4">Historique</th>
              <th className="px-6 py-4 text-center rounded-tr-2xl">Télécharger preuve</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8E8E8]/50">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center font-bold opacity-50">
                  Aucune transaction effectuée.
                </td>
              </tr>
            ) : transactions.map((lot) => {
              const dateStr = new Date(lot.dateEnregistrement).toLocaleDateString("fr-FR");
              
              let badgeStyle = "bg-[#4A3018]/10 text-[#4A3018]";
              let statutText = "Complété";
              if (lot.statut === 'en_attente_magasinier') {
                badgeStyle = "bg-[#4A3018]/10 text-[#4A3018]";
                statutText = "En attente";
              } else if (lot.statut === 'rejete') {
                badgeStyle = "bg-red-500/10 text-red-600";
                statutText = "Annulé";
              } else {
                badgeStyle = "bg-green-500/10 text-green-700";
                statutText = "Complété";
              }

              return (
                <tr key={lot.id} className="hover:bg-white/50 transition-colors">
                  <td className="px-6 py-4 font-semibold">{dateStr}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${badgeStyle}`}>
                      <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                      {statutText}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold">{lot.poidsKg} Kg</td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => setSelectedLot(lot)}
                      className="text-[#4A3018] underline underline-offset-4 decoration-[#4A3018]/30 hover:decoration-[#4A3018] font-semibold transition-all"
                    >
                      Consulter l'historique
                    </button>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button className="inline-flex items-center justify-center p-2 hover:bg-[#E8E8E8] rounded-xl transition-colors">
                      <DownloadIcon size={18} className="opacity-70" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modale Historique */}
      {selectedLot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#8C8075]/30 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setSelectedLot(null)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-[#F5F5F5] transition-colors"
            >
              <XIcon size={20} className="opacity-50" />
            </button>

            <h2 className="text-xl font-black mb-1">Historique de la transaction</h2>
            <p className="text-sm font-semibold opacity-60 mb-6">
              Créé le {new Date(selectedLot.dateEnregistrement).toLocaleDateString("fr-FR", { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>

            <div className="space-y-6">
              {/* Informations du lot */}
              <div>
                <h3 className="text-xs font-bold opacity-50 uppercase tracking-wide mb-3">Informations du lot</h3>
                <div className="bg-[#F5F5F5] rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold opacity-70">Quantité vendue :</span>
                    <span className="font-bold">{selectedLot.poidsKg}Kg</span>
                  </div>
                  <div className="flex justify-between items-center text-sm bg-[#E8E8E8] p-3 rounded-xl">
                    <span className="font-semibold opacity-70">Code unique du lot :</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold font-mono text-xs truncate max-w-[150px]">{selectedLot.lotId}</span>
                      <button onClick={() => copyToClipboard(selectedLot.lotId)} className="hover:opacity-70 transition-opacity">
                        <CopyIcon size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statut à chaque étape */}
              <div>
                <h3 className="text-xs font-bold opacity-50 uppercase tracking-wide mb-3">Statut à chaque étape</h3>
                <div className="bg-[#F5F5F5] rounded-2xl p-5 space-y-4">
                  
                  {/* Step: En attente */}
                  <div className="flex items-center gap-3">
                    <CheckCircle2Icon size={20} className="text-[#4A3018]" />
                    <span className="text-sm font-bold">En attente</span>
                  </div>
                  
                  {/* Step: Complété */}
                  <div className="flex items-center gap-3">
                    {selectedLot.statut !== 'en_attente_magasinier' && selectedLot.statut !== 'rejete' ? (
                      <CheckCircle2Icon size={20} className="text-[#4A3018]" />
                    ) : (
                      <CircleIcon size={20} className="text-[#4A3018]/20" />
                    )}
                    <span className={`text-sm font-bold ${selectedLot.statut !== 'en_attente_magasinier' && selectedLot.statut !== 'rejete' ? '' : 'opacity-40'}`}>
                      Complété
                    </span>
                  </div>

                  {/* Step: Annulé */}
                  <div className="flex items-center gap-3">
                    {selectedLot.statut === 'rejete' ? (
                      <CheckCircle2Icon size={20} className="text-red-500" />
                    ) : (
                      <CircleIcon size={20} className="text-[#4A3018]/20 border-dashed" />
                    )}
                    <span className={`text-sm font-bold ${selectedLot.statut === 'rejete' ? 'text-red-500' : 'opacity-40'}`}>
                      Annulé
                    </span>
                  </div>

                </div>
              </div>

              {/* Informations des vendeurs et acheteurs */}
              <div>
                <h3 className="text-xs font-bold opacity-50 uppercase tracking-wide mb-3">Informations des vendeurs et acheteurs</h3>
                <div className="bg-[#F5F5F5] rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold opacity-70">Agriculteur :</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{selectedLot.agriculteurNom || "Agriculteur"}</span>
                      <LinkIcon size={14} className="opacity-50" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold opacity-70">Acheteur :</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{selectedLot.cooperativeId ? `Magasin ID: ${selectedLot.cooperativeId}` : "Magasin / Coopérative"}</span>
                      <LinkIcon size={14} className="opacity-50" />
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <div className="mt-8 flex justify-end">
              <button 
                onClick={() => setSelectedLot(null)}
                className="bg-[#F5F5F5] text-[#4A3018] font-bold px-6 py-2.5 rounded-xl hover:bg-[#E8E8E8] transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
