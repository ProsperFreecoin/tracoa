"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAgriculteur } from "../../context/AgriculteurContext";
import { useLots } from "../../context/LotsContext";
import { XCircleIcon, AlertTriangleIcon, ArrowRightIcon, HexagonIcon } from "lucide-react";
import { syncUserToDjango } from "../../lib/djangoApi";

export default function CooperativeDashboard() {
  const router = useRouter();
  const { agriculteur, estConnecte } = useAgriculteur();
  const { lots, chargerLotsCooperative, accepterLot, refuserLot } = useLots();
  
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);
  const [motifRejet, setMotifRejet] = useState("");
  const [processingIds, setProcessingIds] = useState<string[]>([]);

  useEffect(() => {
    if (!estConnecte) {
      router.push("/login");
    } else if (agriculteur?.secteur !== "Coopérative") {
      router.push("/");
    } else {
      chargerLotsCooperative(agriculteur.id);
    }
  }, [estConnecte, agriculteur, router]);

  if (!agriculteur || agriculteur.secteur !== "Coopérative") return null;

  // Stats
  const lotsAttente = lots.filter(l => l.statut === 'en_attente_coop' || l.statut === 'enregistre');
  const lotsValides = lots.filter(l => l.statut === 'valide' || l.statut === 'eudrConforme' || l.statut === 'exporte');
  // Ajoutez cette ligne avec vos autres états (useState)
  const [isProcessing, setIsProcessing] = useState(false);
  const totalWeight = lots.reduce((acc, curr) => acc + curr.poidsKg, 0) / 1000; // t
  const traçabilite = lots.length > 0 ? Math.round((lotsValides.length / lots.length) * 100) : 0;
  const alertesGps = 3; // Fausse donnée pour la maquette

  const handleAccepter = async (lotId: string, lotAgriculteurId: string, agriculteurNom?: string) => {
    setProcessingIds(prev => [...prev, lotId]);
    try {
      const coopDjangoId = await syncUserToDjango(agriculteur);
      const farmerNom = agriculteurNom || "Agriculteur";
      const fakeFarmer = { 
        id: lotAgriculteurId, 
        prenom: farmerNom.split(' ')[0], 
        nom: farmerNom.split(' ')[1] || "", 
        email: `${lotAgriculteurId}@tracao.local`, 
        secteur: "Producteur", 
        certifie: false 
      };
      const producerDjangoId = await syncUserToDjango(fakeFarmer as any);

      if (!coopDjangoId || !producerDjangoId) {
        throw new Error("Impossible de synchroniser avec le Smart Contract (IDs manquants)");
      }

      await accepterLot(lotId, coopDjangoId, producerDjangoId, fakeFarmer.email);
      alert("Lot validé et envoyé sur la blockchain avec succès !");
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
      
      {/* 4 Stats Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#EBE3D5] flex flex-col items-center justify-center text-center">
          <span className="text-4xl font-serif font-bold text-[#825026] mb-1">{lotsAttente.length}</span>
          <span className="text-sm font-semibold text-[#A8886A]">Lots en attente</span>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#EBE3D5] flex flex-col items-center justify-center text-center">
          <span className="text-4xl font-serif font-bold text-[#825026] mb-1">{totalWeight.toFixed(1)}t</span>
          <span className="text-sm font-semibold text-[#A8886A]">Stock total</span>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#EBE3D5] flex flex-col items-center justify-center text-center">
          <span className="text-4xl font-serif font-bold text-[#825026] mb-1">{traçabilite}%</span>
          <span className="text-sm font-semibold text-[#A8886A]">Traçabilité</span>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#EBE3D5] flex flex-col items-center justify-center text-center">
          <span className="text-4xl font-serif font-bold text-[#825026] mb-1">{alertesGps}</span>
          <span className="text-sm font-semibold text-[#A8886A]">Alertes GPS</span>
        </div>
      </div>

      {/* Alert Banner */}
      <div className="bg-[#F0D182] rounded-xl p-4 mb-10 flex items-center gap-3 shadow-sm">
        <AlertTriangleIcon size={20} className="text-[#825026]" />
        <p className="font-semibold text-[#825026]">
          <strong>LOT-2026-0047</strong> Écart GPS détecté. Vérification requise avant transfert.
        </p>
      </div>

      {/* Table Title */}
      <h2 className="text-2xl font-serif font-bold text-[#5D3A1A] mb-6">Lots à valider et transférer</h2>

      {/* Table */}
      <div className="overflow-x-auto pb-10">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-[#EBE3D5]">
              <th className="pb-4 font-bold text-xs text-[#A8886A] uppercase tracking-wider">ID LOT</th>
              <th className="pb-4 font-bold text-xs text-[#A8886A] uppercase tracking-wider">AGRICULTEUR</th>
              <th className="pb-4 font-bold text-xs text-[#A8886A] uppercase tracking-wider">POIDS</th>
              <th className="pb-4 font-bold text-xs text-[#A8886A] uppercase tracking-wider">GPS</th>
              <th className="pb-4 font-bold text-xs text-[#A8886A] uppercase tracking-wider">DATE RÉCOLTE</th>
              <th className="pb-4 font-bold text-xs text-[#A8886A] uppercase tracking-wider">STATUT</th>
              <th className="pb-4 font-bold text-xs text-[#A8886A] uppercase tracking-wider">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {lotsAttente.map((lot, idx) => {
              const isEnAttente = lot.statut === 'en_attente_coop' || lot.statut === 'enregistre';
              const isValide = lot.statut === 'valide' || lot.statut === 'eudrConforme';
              const isRejete = lot.statut === 'rejete';
              
              // Simuler l'alerte GPS pour le design si c'est le lot 0047 ou un lot rejeté
              const hasGpsAlert = isRejete || idx === 2; 

              return (
                <tr key={lot.id} className="border-b border-[#EBE3D5] last:border-none hover:bg-white/50 transition-colors">
                  <td className="py-6 pr-4 font-mono font-medium text-[#825026] text-sm break-all w-[100px]">
                    {lot.lotId.replace('-', '-\n')}
                  </td>
                  <td className="py-6 pr-4 font-semibold">{lot.agriculteurNom || lot.agriculteurId.substring(0, 10) + "..."}</td>
                  <td className="py-6 pr-4 font-semibold">{lot.poidsKg} <br/><span className="text-xs text-[#A8886A]">kg</span></td>
                  <td className="py-6 pr-4">
                    {hasGpsAlert ? (
                      <span className="bg-[#F8D7DA] text-[#A63A44] px-3 py-1.5 rounded-md text-xs font-bold whitespace-nowrap">
                        Écart GPS
                      </span>
                    ) : (
                      <span className="bg-[#D4EDDA] text-[#285b37] px-3 py-1.5 rounded-md text-xs font-bold whitespace-nowrap">
                        Vérifié
                      </span>
                    )}
                  </td>
                  <td className="py-6 pr-4 font-medium text-sm">
                    {new Date(lot.dateRecolte).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="py-6 pr-4">
                    {isEnAttente && (
                      <span className="bg-[#F0D182] text-[#825026] px-3 py-1.5 rounded-md text-xs font-bold whitespace-nowrap">
                        En attente
                      </span>
                    )}
                    {isRejete && (
                      <span className="bg-[#F8D7DA] text-[#A63A44] px-3 py-1.5 rounded-md text-xs font-bold whitespace-nowrap">
                        Alerte
                      </span>
                    )}
                    {isValide && (
                      <span className="bg-[#D4EDDA] text-[#285b37] px-3 py-1.5 rounded-md text-xs font-bold whitespace-nowrap">
                        Validé
                      </span>
                    )}
                  </td>
                  <td className="py-6 text-right">
                    {isEnAttente && (
                      <div className="flex gap-2 justify-end">
                        <button 
                          disabled={processingIds.includes(lot.lotId)}
                          onClick={() => handleAccepter(lot.lotId, lot.agriculteurId, lot.agriculteurNom)}
                          className="bg-[#825026] text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-[#5d3a1a] transition-colors whitespace-nowrap disabled:opacity-50"
                        >
                          {processingIds.includes(lot.lotId) ? "Validation..." : "Accepter"}
                        </button>
                        <button 
                          disabled={processingIds.includes(lot.lotId)}
                          onClick={() => setSelectedLotId(lot.lotId)}
                          className="bg-white text-[#825026] border border-[#825026] px-3 py-2.5 rounded-lg font-bold text-sm hover:bg-[#FDF9F1] transition-colors whitespace-nowrap disabled:opacity-50"
                        >
                          <XCircleIcon size={18} />
                        </button>
                      </div>
                    )}
                    {isRejete && (
                      <button className="bg-white text-[#825026] border border-[#EBE3D5] px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-[#FDF9F1] transition-colors whitespace-nowrap flex items-center justify-end w-full gap-2 shadow-sm">
                        Vérifier <ArrowRightIcon size={16} />
                      </button>
                    )}
                    {isValide && (
                      <button className="bg-white text-[#825026] border border-[#EBE3D5] px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-[#FDF9F1] transition-colors whitespace-nowrap flex items-center justify-end w-full gap-2 shadow-sm">
                        Transférer <ArrowRightIcon size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            
            {lots.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-[#A8886A] font-bold">Aucun lot à afficher.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Transfert Rapide */}
      <div className="mt-4 bg-[#F5ECD8] rounded-2xl p-6 lg:p-8 max-w-4xl mx-auto w-full mb-10">
        <h3 className="text-xs font-bold text-[#A8886A] uppercase tracking-widest mb-4">Transfert rapide vers transformateur</h3>
        <div className="flex flex-col sm:flex-row gap-4">
          <input 
            type="text" 
            placeholder="LOT-2026-0044" 
            className="flex-1 border border-[#EBE3D5] bg-[#FDF9F1] rounded-lg px-4 py-3 text-[#5D3A1A] font-medium focus:outline-none focus:border-[#825026]"
          />
          <input 
            type="text" 
            placeholder="TransCacao SARL" 
            className="flex-1 border border-[#EBE3D5] bg-[#FDF9F1] rounded-lg px-4 py-3 text-[#5D3A1A] font-medium focus:outline-none focus:border-[#825026]"
          />
          <button className="bg-[#825026] text-white px-8 py-3 rounded-lg font-bold hover:bg-[#5d3a1a] transition-colors flex items-center justify-center gap-2">
            <HexagonIcon size={18} /> Envoyer
          </button>
        </div>
      </div>

      {/* Reject Modal */}
      {selectedLotId && (
        <div className="fixed inset-0 z-50 bg-[#5D3A1A]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FDF9F1] rounded-2xl w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-4 text-[#A63A44]">
              <XCircleIcon size={28} />
              <h3 className="text-xl font-black font-serif">Refuser le lot</h3>
            </div>
            <p className="text-sm text-[#825026] mb-6">
              Veuillez indiquer la raison du refus. Ce motif sera envoyé à l'agriculteur.
            </p>
            
            <form onSubmit={handleRefuser}>
              <textarea 
                value={motifRejet}
                onChange={(e) => setMotifRejet(e.target.value)}
                placeholder="Ex: Écart GPS non justifié..."
                className="w-full bg-white border border-[#EBE3D5] rounded-xl p-4 min-h-[100px] text-sm font-medium focus:ring-2 focus:ring-[#825026] focus:border-transparent outline-none transition-all mb-6 text-[#5D3A1A]"
                required
              />
              
              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => { setSelectedLotId(null); setMotifRejet(""); }}
                  className="flex-1 py-3 bg-white border border-[#EBE3D5] text-[#825026] font-bold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  disabled={(selectedLotId ? processingIds.includes(selectedLotId) : false) || !motifRejet.trim()}
                  className="flex-1 py-3 bg-[#A63A44] text-white font-bold rounded-xl hover:bg-red-800 transition-colors disabled:opacity-50"
                >
                  {(selectedLotId ? processingIds.includes(selectedLotId) : false) ? "Traitement..." : "Confirmer le refus"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
