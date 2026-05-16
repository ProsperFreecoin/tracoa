"use client";

import { useState } from "react";
import { useLots } from "../../context/LotsContext";
import { LotCard } from "../../components/ui/LotCard";
import { SearchIcon, FilterIcon, PackageIcon, PlusIcon, XIcon, ChevronDownIcon } from "lucide-react";
import { CreateLotModal } from "../../components/CreateLotModal";

type FilterType = "none" | "culture" | "poids" | "nom";

export default function MesLotsScreen() {
  const { lots, totalLots, totalPoidsKg, lotsSyncronises } = useLots();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("none");
  const [cropFilter, setCropFilter] = useState("all");
  const [minWeight, setMinWeight] = useState("");
  const [maxWeight, setMaxWeight] = useState("");
  
  const [isCreating, setIsCreating] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const filteredLots = lots.filter(lot => {
    const matchSearch = searchTerm === "" || 
      lot.lotId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lot.agriculteurNom || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchCrop = cropFilter === "all" || lot.typeProduit === cropFilter;
    const weight = lot.poidsKg;
    const matchMin = minWeight === "" || weight >= parseFloat(minWeight);
    const matchMax = maxWeight === "" || weight <= parseFloat(maxWeight);
    
    return matchSearch && matchCrop && matchMin && matchMax;
  });

  const clearFilters = () => {
    setActiveFilter("none");
    setCropFilter("all");
    setMinWeight("");
    setMaxWeight("");
    setSearchTerm("");
  };

  const hasActiveFilters = cropFilter !== "all" || minWeight !== "" || maxWeight !== "" || searchTerm !== "";

  return (
    <div className="flex flex-col flex-1 bg-[#FAF9F6] lg:bg-[#FAF9F6] min-h-screen">
      {/* Header */}
      <div className="bg-white lg:rounded-2xl lg:m-6 lg:mb-0 p-6 text-tracao-choco shadow-sm border border-tracao-border-light relative z-10">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold">Gestion des lots</h1>
            <p className="text-xs text-tracao-choco-pale mt-0.5">Gérer efficacement vos lots</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Search icon (desktop) */}
            <div className="relative hidden lg:block">
              <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-tracao-choco-pale" size={16} />
              <input 
                type="text" 
                placeholder="Rechercher..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#F5F5F5] rounded-xl py-2.5 pl-10 pr-4 text-sm text-tracao-choco placeholder:text-tracao-choco-pale focus:outline-none focus:ring-2 focus:ring-tracao-cacao w-56"
              />
            </div>

            {/* Filter button */}
            <div className="relative">
              <button 
                className={`p-2.5 rounded-xl flex items-center justify-center transition-colors ${
                  showFilterMenu || hasActiveFilters
                    ? "bg-tracao-cacao text-white"
                    : "bg-tracao-cream-mid text-tracao-choco hover:bg-tracao-cream-mid/80"
                }`}
                onClick={() => setShowFilterMenu(!showFilterMenu)}
              >
                <FilterIcon size={18} />
              </button>

              {/* Filter dropdown menu */}
              {showFilterMenu && (
                <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-30 w-64 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-tracao-choco uppercase tracking-wide">Filtrer par</span>
                    {hasActiveFilters && (
                      <button onClick={clearFilters} className="text-[10px] text-tracao-cacao font-semibold hover:underline">
                        Réinitialiser
                      </button>
                    )}
                  </div>

                  {/* Filter options */}
                  <div className="p-2">
                    {/* By culture */}
                    <button
                      onClick={() => setActiveFilter(activeFilter === "culture" ? "none" : "culture")}
                      className={`w-full px-3 py-2.5 rounded-lg text-left text-sm font-medium flex items-center justify-between transition-colors ${
                        activeFilter === "culture" ? "bg-tracao-cacao/5 text-tracao-cacao" : "text-tracao-choco hover:bg-gray-50"
                      }`}
                    >
                      <span>Par culture</span>
                      <ChevronDownIcon size={14} className={`transition-transform ${activeFilter === "culture" ? "rotate-180" : ""}`} />
                    </button>
                    {activeFilter === "culture" && (
                      <div className="px-3 py-2 space-y-1">
                        {["all", "cacao", "cafe"].map(val => (
                          <label key={val} className="flex items-center gap-2 py-1.5 text-sm cursor-pointer">
                            <input
                              type="radio"
                              name="crop"
                              value={val}
                              checked={cropFilter === val}
                              onChange={() => setCropFilter(val)}
                              className="accent-tracao-cacao w-3.5 h-3.5"
                            />
                            <span className={cropFilter === val ? "text-tracao-cacao font-semibold" : "text-gray-600"}>
                              {val === "all" ? "Toutes" : val === "cacao" ? "Cacao" : "Café"}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}

                    {/* By weight */}
                    <button
                      onClick={() => setActiveFilter(activeFilter === "poids" ? "none" : "poids")}
                      className={`w-full px-3 py-2.5 rounded-lg text-left text-sm font-medium flex items-center justify-between transition-colors ${
                        activeFilter === "poids" ? "bg-tracao-cacao/5 text-tracao-cacao" : "text-tracao-choco hover:bg-gray-50"
                      }`}
                    >
                      <span>Par taille (poids)</span>
                      <ChevronDownIcon size={14} className={`transition-transform ${activeFilter === "poids" ? "rotate-180" : ""}`} />
                    </button>
                    {activeFilter === "poids" && (
                      <div className="px-3 py-2 flex gap-2">
                        <input
                          type="number"
                          placeholder="Min (kg)"
                          value={minWeight}
                          onChange={(e) => setMinWeight(e.target.value)}
                          className="flex-1 border border-gray-200 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-tracao-cacao"
                        />
                        <input
                          type="number"
                          placeholder="Max (kg)"
                          value={maxWeight}
                          onChange={(e) => setMaxWeight(e.target.value)}
                          className="flex-1 border border-gray-200 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-tracao-cacao"
                        />
                      </div>
                    )}

                    {/* By name / ID */}
                    <button
                      onClick={() => setActiveFilter(activeFilter === "nom" ? "none" : "nom")}
                      className={`w-full px-3 py-2.5 rounded-lg text-left text-sm font-medium flex items-center justify-between transition-colors ${
                        activeFilter === "nom" ? "bg-tracao-cacao/5 text-tracao-cacao" : "text-tracao-choco hover:bg-gray-50"
                      }`}
                    >
                      <span>Par nom / ID</span>
                      <ChevronDownIcon size={14} className={`transition-transform ${activeFilter === "nom" ? "rotate-180" : ""}`} />
                    </button>
                    {activeFilter === "nom" && (
                      <div className="px-3 py-2">
                        <input
                          type="text"
                          placeholder="Rechercher par nom ou ID..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full border border-gray-200 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-tracao-cacao"
                        />
                      </div>
                    )}
                  </div>

                  {/* Apply / close */}
                  <div className="px-3 py-2 border-t border-gray-100">
                    <button
                      onClick={() => setShowFilterMenu(false)}
                      className="w-full py-2 bg-tracao-choco text-white text-xs font-bold rounded-lg hover:bg-tracao-cacao transition-colors"
                    >
                      Appliquer
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Create button */}
            <button 
              onClick={() => setIsCreating(true)}
              className="bg-tracao-cacao text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-tracao-choco transition-colors shadow-md"
            >
              <PlusIcon size={16} /> Créer un lot
            </button>
          </div>
        </div>

        {/* Mobile search */}
        <div className="lg:hidden relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-tracao-choco-pale" size={16} />
          <input 
            type="text" 
            placeholder="Rechercher par ID de lot..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#F5F5F5] rounded-xl py-3 pl-11 pr-4 text-sm text-tracao-choco placeholder:text-tracao-choco-pale focus:outline-none focus:ring-2 focus:ring-tracao-cacao"
          />
        </div>

        {/* Active filters badges */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {cropFilter !== "all" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-tracao-cacao/10 text-tracao-cacao text-[11px] font-semibold rounded-full">
                {cropFilter === "cacao" ? "🍫 Cacao" : "☕ Café"}
                <button onClick={() => setCropFilter("all")} className="hover:text-tracao-choco"><XIcon size={10} /></button>
              </span>
            )}
            {(minWeight || maxWeight) && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-tracao-cacao/10 text-tracao-cacao text-[11px] font-semibold rounded-full">
                {minWeight && `≥${minWeight}kg`} {minWeight && maxWeight && "–"} {maxWeight && `≤${maxWeight}kg`}
                <button onClick={() => { setMinWeight(""); setMaxWeight(""); }} className="hover:text-tracao-choco"><XIcon size={10} /></button>
              </span>
            )}
            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-tracao-cacao/10 text-tracao-cacao text-[11px] font-semibold rounded-full">
                &quot;{searchTerm}&quot;
                <button onClick={() => setSearchTerm("")} className="hover:text-tracao-choco"><XIcon size={10} /></button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 lg:p-6 mt-2 mb-20 lg:mb-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          
          {/* Dotted Create Lot Card */}
          <button 
            onClick={() => setIsCreating(true)}
            className="w-full h-[180px] border-2 border-dashed border-tracao-border rounded-2xl flex flex-col items-center justify-center text-tracao-choco-pale hover:border-tracao-cacao hover:text-tracao-cacao hover:bg-tracao-cacao/5 transition-all group"
          >
            <div className="w-12 h-12 bg-tracao-cream-mid rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <PlusIcon size={24} />
            </div>
            <span className="font-bold text-sm">Enregistrer un lot</span>
            <span className="text-[10px] mt-1 opacity-70">GPS automatique · Blockchain</span>
          </button>

          {filteredLots.map(lot => (
            <LotCard key={lot.id} lot={lot} />
          ))}
        </div>

        {filteredLots.length === 0 && lots.length > 0 && (
          <div className="text-center py-16 col-span-full">
            <PackageIcon size={48} className="mx-auto text-tracao-choco-pale mb-4" />
            <p className="text-sm font-bold text-tracao-choco-light">Aucun lot ne correspond à vos filtres.</p>
            <button onClick={clearFilters} className="mt-2 text-xs text-tracao-cacao font-semibold hover:underline">
              Réinitialiser les filtres
            </button>
          </div>
        )}
      </div>

      {isCreating && (
        <CreateLotModal onClose={() => setIsCreating(false)} />
      )}

      {/* Click-away overlay for filter dropdown */}
      {showFilterMenu && (
        <div className="fixed inset-0 z-0" onClick={() => setShowFilterMenu(false)} />
      )}
    </div>
  );
}
