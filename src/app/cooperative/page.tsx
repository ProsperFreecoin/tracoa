"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAgriculteur } from "../../context/AgriculteurContext";
import { useLots } from "../../context/LotsContext";
import { SearchIcon, FilterIcon, EyeIcon, CheckCircle2Icon, XCircleIcon, XIcon } from "lucide-react";

export default function MagasinierDashboard() {
  const router = useRouter();
  const { agriculteur, estConnecte } = useAgriculteur();
  const { lots, chargerLotsCooperative, accepterLot, refuserLot } = useLots();
  
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);
  const [modalType, setModalType] = useState<"approve" | "reject" | null>(null);
  const [motif, setMotif] = useState("");
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "en_attente_magasinier" | "transfere" | "rejete">("all");

  useEffect(() => {
    if (estConnecte && agriculteur?.secteur === "Magasinier") {
      chargerLotsCooperative(agriculteur.id);
    }
  }, [estConnecte, agriculteur, chargerLotsCooperative]);

  if (!agriculteur || agriculteur.secteur !== "Magasinier") return null;

  const handleOpenModal = (type: "approve" | "reject", lotId: string) => {
    setModalType(type);
    setSelectedLotId(lotId);
    setMotif("");
  };

  const handleCloseModal = () => {
    setModalType(null);
    setSelectedLotId(null);
    setMotif("");
  };

  const handleConfirm = async () => {
    if (!selectedLotId) return;
    setProcessingIds(prev => [...prev, selectedLotId]);
    
    try {
      const lot = lots.find(l => l.lotId === selectedLotId);
      if (!lot) return;

      if (modalType === "approve") {
        const magasinierId = agriculteur.djangoId || parseInt(agriculteur.id);
        await accepterLot(selectedLotId, magasinierId, parseInt(lot.agriculteurId), "", motif);
      } else if (modalType === "reject") {
        await refuserLot(selectedLotId, motif);
      }
      handleCloseModal();
    } catch (e: any) {
      alert("Erreur lors de l'opération: " + e.message);
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== selectedLotId));
    }
  };

  const filteredLots = lots.filter(lot => {
    const matchesSearch = lot.lotId.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          lot.typeProduit.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesStatus = true;
    if (statusFilter !== "all") {
      if (statusFilter === "transfere") {
        matchesStatus = lot.statut !== 'en_attente_magasinier' && lot.statut !== 'rejete';
      } else {
        matchesStatus = lot.statut === statusFilter;
      }
    }
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col flex-1 bg-[#F5EFE6] min-h-screen text-[#4A3018] p-8 overflow-y-auto">
      
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold">Lots à vérifier</h1>
          <p className="text-sm font-semibold opacity-60">Voici la liste des lots soumis à vérification</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-[#EBE3D5] rounded-xl outline-none focus:ring-1 focus:ring-[#4A3018] text-sm"
            />
            <SearchIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50" />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-[#4A3018] text-white px-4 py-2 rounded-xl text-sm font-bold appearance-none outline-none cursor-pointer"
          >
            <option value="all">Filtres</option>
            <option value="en_attente_magasinier">En attente</option>
            <option value="transfere">Approuvés</option>
            <option value="rejete">Rejetés</option>
          </select>
        </div>
      </div>

      <div className="bg-[#EBE3D5]/50 rounded-3xl overflow-hidden border border-[#EBE3D5]">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-[#EBE3D5] font-bold text-[#4A3018]/60">
            <tr>
              <th className="px-6 py-4 rounded-tl-2xl">Id</th>
              <th className="px-6 py-4">Code unique</th>
              <th className="px-6 py-4">Saison</th>
              <th className="px-6 py-4">Culture</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Id parcel</th>
              <th className="px-6 py-4 text-center rounded-tr-2xl">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EBE3D5]/50">
            {filteredLots.map((lot) => {
              const isEnAttente = lot.statut === 'en_attente_magasinier';
              const isRejete = lot.statut === 'rejete';
              const isApprouve = !isEnAttente && !isRejete;

              let badgeClass = "";
              let badgeText = "";
              if (isApprouve) { badgeClass = "bg-green-500/10 text-green-700"; badgeText = "Approuvé"; }
              else if (isRejete) { badgeClass = "bg-red-500/10 text-red-600"; badgeText = "Rejeté"; }
              else { badgeClass = "bg-[#F59E0B]/10 text-[#F59E0B]"; badgeText = "En attente"; }

              return (
                <tr key={lot.id} className="hover:bg-white/40 transition-colors">
                  <td className="px-6 py-4 font-mono font-semibold opacity-70">{lot.id.substring(0,6)}...</td>
                  <td className="px-6 py-4 font-mono font-bold opacity-80">{lot.lotId}</td>
                  <td className="px-6 py-4 font-semibold opacity-80">2026-2027</td>
                  <td className="px-6 py-4 font-bold capitalize">{lot.typeProduit}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${badgeClass}`}>
                      <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                      {badgeText}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono opacity-60 text-xs">{lot.farmId || "N/A"}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button className="p-1.5 hover:bg-[#EBE3D5] rounded-lg transition-colors text-[#4A3018]/50 hover:text-[#4A3018]">
                        <EyeIcon size={16} />
                      </button>
                      {isEnAttente && (
                        <>
                          <button 
                            disabled={processingIds.includes(lot.lotId)}
                            onClick={() => handleOpenModal("approve", lot.lotId)}
                            className="p-1.5 hover:bg-green-500/10 rounded-lg transition-colors text-green-600/50 hover:text-green-600 disabled:opacity-30"
                          >
                            <CheckCircle2Icon size={16} />
                          </button>
                          <button 
                            disabled={processingIds.includes(lot.lotId)}
                            onClick={() => handleOpenModal("reject", lot.lotId)}
                            className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors text-red-600/50 hover:text-red-600 disabled:opacity-30"
                          >
                            <XCircleIcon size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredLots.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center font-bold opacity-50">
                  Aucun lot trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#4A3018]/20 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold mb-1">
              {modalType === "approve" ? "Approuvé le lot" : "Rejeter le lot"}
            </h2>
            <p className="text-sm font-semibold opacity-60 mb-6">
              Êtes-vous sûr de vouloir {modalType === "approve" ? "approuvé" : "rejeter"} cet lot ?
            </p>

            <div className="mb-8">
              <label className="block text-xs font-bold opacity-50 mb-2">Donner une raison</label>
              <textarea 
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                placeholder="Entrer un commentaire"
                className="w-full bg-[#F5F5F5] rounded-xl p-4 outline-none focus:ring-1 focus:ring-[#4A3018] min-h-[100px] text-sm font-semibold"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button 
                onClick={handleCloseModal}
                className="px-6 py-3 rounded-full font-bold bg-[#F5F5F5] hover:bg-[#E8E8E8] transition-colors"
              >
                Annuler
              </button>
              <button 
                onClick={handleConfirm}
                disabled={processingIds.length > 0 || (modalType === 'reject' && !motif.trim())}
                className={`px-6 py-3 rounded-full font-bold text-white transition-colors disabled:opacity-50 ${
                  modalType === "approve" ? "bg-[#273B1B] hover:bg-[#1A2812]" : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {modalType === "approve" ? "Approuver le lot" : "Rejeter le lot"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
