"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAgriculteur } from "../../context/AgriculteurContext";
import { useLots } from "../../context/LotsContext";
import { XCircleIcon, AlertTriangleIcon, ArrowRightIcon, HexagonIcon } from "lucide-react";

export default function MagasinierDashboard() {
  const router = useRouter();
  const { agriculteur, estConnecte } = useAgriculteur();
  const { lots, chargerLotsCooperative, accepterLot, refuserLot } = useLots();
  
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);
  const [motifRejet, setMotifRejet] = useState("");
  const [processingIds, setProcessingIds] = useState<string[]>([]);

  useEffect(() => {
    if (estConnecte && agriculteur?.secteur === "Magasinier") {
      chargerLotsCooperative(agriculteur.id);
    }
  }, [estConnecte, agriculteur, chargerLotsCooperative]);

  if (!agriculteur || agriculteur.secteur !== "Magasinier") return null;

  // Stats
  const lotsAttente = lots.filter(l => l.statut === 'en_attente_magasinier');
  const lotsValides = lots.filter(l => l.statut === 'transfere' || l.statut === 'enTransformation' || l.statut === 'exporte');
  const totalWeight = lots.reduce((acc, curr) => acc + curr.poidsKg, 0) / 1000; // t
  const traçabilite = lots.length > 0 ? Math.round((lotsValides.length / lots.length) * 100) : 0;

  const handleAccepter = async (lotId: string, lotAgriculteurId: string, agriculteurNom?: string) => {
    setProcessingIds(prev => [...prev, lotId]);
    try {
      // agriculteur.djangoId est l'ID du magasinier connecté
      const magasinierId = agriculteur.djangoId || parseInt(agriculteur.id);
      
      await accepterLot(lotId, magasinierId, parseInt(lotAgriculteurId), "");
      alert("Lot validé et réceptionné au magasin !");
    } catch (e: any) {
      alert("Erreur lors de la validation: " + e.message);
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== lotId));
    }
  };

  const handleRefuser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLotId || !motifRejet.trim()) return;
    
    setProcessingIds(prev => [...prev, selectedLotId]);
    try {
      await refuserLot(selectedLotId, motifRejet);
      setSelectedLotId(null);
      setMotifRejet("");
    } catch (e) {
      alert("Erreur lors du refus");
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== selectedLotId));
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-[#FDF9F1] min-h-screen text-[#5D3A1A] p-8 overflow-y-auto">
      
      <div className="mb-10">
        <h1 className="text-3xl font-serif font-black text-[#5D3A1A]">Espace Magasinier</h1>
        <p className="text-[#A8886A] font-medium mt-1">Gestion des collectes et réceptions de lots</p>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#EBE3D5] flex flex-col items-center justify-center text-center">
          <span className="text-4xl font-serif font-bold text-[#825026] mb-1">{lotsAttente.length}</span>
          <span className="text-sm font-semibold text-[#A8886A]">À réceptionner</span>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#EBE3D5] flex flex-col items-center justify-center text-center">
          <span className="text-4xl font-serif font-bold text-[#825026] mb-1">{totalWeight.toFixed(1)}t</span>
          <span className="text-sm font-semibold text-[#A8886A]">Stock en magasin</span>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#EBE3D5] flex flex-col items-center justify-center text-center">
          <span className="text-4xl font-serif font-bold text-[#825026] mb-1">{traçabilite}%</span>
          <span className="text-sm font-semibold text-[#A8886A]">Taux Traçabilité</span>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#EBE3D5] flex flex-col items-center justify-center text-center">
          <span className="text-4xl font-serif font-bold text-[#825026] mb-1">3</span>
          <span className="text-sm font-semibold text-[#A8886A]">Alertes EUDR</span>
        </div>
      </div>

      {/* Table Title */}
      <h2 className="text-2xl font-serif font-bold text-[#5D3A1A] mb-6">Réception des récoltes</h2>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#EBE3D5] overflow-hidden mb-10">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8F5F0] border-b border-[#EBE3D5]">
                <th className="p-4 font-bold text-xs text-[#A8886A] uppercase tracking-wider">ID LOT</th>
                <th className="p-4 font-bold text-xs text-[#A8886A] uppercase tracking-wider">AGRICULTEUR</th>
                <th className="p-4 font-bold text-xs text-[#A8886A] uppercase tracking-wider">PRODUIT</th>
                <th className="p-4 font-bold text-xs text-[#A8886A] uppercase tracking-wider">POIDS</th>
                <th className="p-4 font-bold text-xs text-[#A8886A] uppercase tracking-wider">DATE</th>
                <th className="p-4 font-bold text-xs text-[#A8886A] uppercase tracking-wider">STATUT</th>
                <th className="p-4 font-bold text-xs text-[#A8886A] uppercase tracking-wider">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {lots.map((lot) => {
                const isEnAttente = lot.statut === 'en_attente_magasinier';
                const isValide = lot.statut === 'transfere' || lot.statut === 'enTransformation';
                const isRejete = lot.statut === 'rejete';

                return (
                  <tr key={lot.id} className="border-b border-[#F8F5F0] last:border-none hover:bg-[#FDF9F1] transition-colors">
                    <td className="p-4 font-mono text-sm text-[#825026]">{lot.lotId}</td>
                    <td className="p-4 font-bold">{lot.agriculteurNom || "Producteur"}</td>
                    <td className="p-4 capitalize">{lot.typeProduit}</td>
                    <td className="p-4 font-bold">{lot.poidsKg} kg</td>
                    <td className="p-4 text-sm text-[#A8886A]">{new Date(lot.dateRecolte).toLocaleDateString()}</td>
                    <td className="p-4">
                      {isEnAttente && <span className="bg-[#FFF8E1] text-[#F59E0B] px-3 py-1 rounded-full text-xs font-bold">À réceptionner</span>}
                      {isValide && <span className="bg-[#ECFDF5] text-[#10B981] px-3 py-1 rounded-full text-xs font-bold">En Magasin</span>}
                      {isRejete && <span className="bg-[#FEF2F2] text-[#EF4444] px-3 py-1 rounded-full text-xs font-bold">Rejeté</span>}
                    </td>
                    <td className="p-4">
                      {isEnAttente && (
                        <div className="flex gap-2">
                          <button 
                            disabled={processingIds.includes(lot.lotId)}
                            onClick={() => handleAccepter(lot.lotId, lot.agriculteurId, lot.agriculteurNom)}
                            className="bg-[#825026] text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-[#5d3a1a] transition-all disabled:opacity-50"
                          >
                            Accepter
                          </button>
                          <button 
                            disabled={processingIds.includes(lot.lotId)}
                            onClick={() => setSelectedLotId(lot.lotId)}
                            className="bg-white text-[#EF4444] border border-[#EF4444]/20 px-4 py-2 rounded-lg font-bold text-xs hover:bg-[#FEF2F2] transition-all disabled:opacity-50"
                          >
                            Refuser
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {lots.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-[#A8886A] font-medium">Aucun lot à traiter pour le moment.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Modal */}
      {selectedLotId && (
        <div className="fixed inset-0 z-50 bg-[#5D3A1A]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FDF9F1] rounded-2xl w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-serif font-black mb-4">Refuser le lot</h3>
            <textarea 
              value={motifRejet}
              onChange={(e) => setMotifRejet(e.target.value)}
              placeholder="Motif du refus (ex: qualité non conforme)..."
              className="w-full bg-white border border-[#EBE3D5] rounded-xl p-4 min-h-[100px] text-sm mb-6 outline-none focus:border-[#825026]"
            />
            <div className="flex gap-3">
              <button onClick={() => setSelectedLotId(null)} className="flex-1 py-3 font-bold text-[#825026]">Annuler</button>
              <button onClick={handleRefuser} className="flex-1 py-3 bg-[#EF4444] text-white font-bold rounded-xl">Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
