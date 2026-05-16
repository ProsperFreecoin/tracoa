"use client";

import { useState } from "react";
import { useLots } from "../../context/LotsContext";
import { LotCard } from "../../components/ui/LotCard";
import { SearchIcon, FilterIcon, PackageIcon, PlusIcon } from "lucide-react";
import { CreateLotModal } from "../../components/CreateLotModal";

export default function MesLotsScreen() {
  const { lots, totalLots, totalPoidsKg, lotsSyncronises } = useLots();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [cropFilter, setCropFilter] = useState("all"); // 'all', 'cacao', 'cafe'
  const [minWeight, setMinWeight] = useState("");
  const [maxWeight, setMaxWeight] = useState("");
  
  const [isCreating, setIsCreating] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const filteredLots = lots.filter(lot => {
    const matchSearch = lot.lotId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCrop = cropFilter === "all" || lot.typeProduit === cropFilter;
    const weight = lot.poidsKg;
    const matchMin = minWeight === "" || weight >= parseFloat(minWeight);
    const matchMax = maxWeight === "" || weight <= parseFloat(maxWeight);
    
    return matchSearch && matchCrop && matchMin && matchMax;
  });

  return (
    <div className="flex flex-col flex-1 bg-[#FAF9F6] lg:bg-[#FAF9F6] min-h-screen">
      {/* Header */}
      <div className="bg-white lg:rounded-2xl lg:m-6 lg:mb-0 p-6 text-tracao-choco shadow-sm border border-tracao-border-light relative z-10">
        <div className="flex justify-between items-center mb-5">
          <h1 className="text-xl lg:text-2xl font-bold">Gestion des lots</h1>
          <button 
            onClick={() => setIsCreating(true)}
            className="bg-tracao-cacao text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-tracao-choco transition-colors shadow-md"
          >
            <PlusIcon size={16} /> Créer un lot
          </button>
        </div>

        {/* Filter Bars */}
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-tracao-choco-pale" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher par ID de lot..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#F5F5F5] rounded-xl py-3 pl-11 pr-4 text-sm text-tracao-choco placeholder:text-tracao-choco-pale focus:outline-none focus:ring-2 focus:ring-tracao-cacao"
            />
          </div>
          
          {/* Toggle Filters (Mobile) */}
          <button 
            className="lg:hidden bg-tracao-cream-mid text-tracao-choco p-3 rounded-xl flex items-center justify-center"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FilterIcon size={20} />
          </button>
          
          {/* Advanced Filters */}
          <div className={`${showFilters ? 'flex' : 'hidden'} lg:flex flex-col lg:flex-row gap-3`}>
            <select 
              value={cropFilter}
              onChange={(e) => setCropFilter(e.target.value)}
              className="bg-[#F5F5F5] rounded-xl py-3 px-4 text-sm text-tracao-choco focus:outline-none focus:ring-2 focus:ring-tracao-cacao"
            >
              <option value="all">Toutes les cultures</option>
              <option value="cacao">Cacao</option>
              <option value="cafe">Café</option>
            </select>
            
            <div className="flex gap-2">
              <input 
                type="number" 
                placeholder="Poids Min (Kg)" 
                value={minWeight}
                onChange={(e) => setMinWeight(e.target.value)}
                className="w-full lg:w-32 bg-[#F5F5F5] rounded-xl py-3 px-4 text-sm text-tracao-choco placeholder:text-tracao-choco-pale focus:outline-none focus:ring-2 focus:ring-tracao-cacao"
              />
              <input 
                type="number" 
                placeholder="Poids Max (Kg)" 
                value={maxWeight}
                onChange={(e) => setMaxWeight(e.target.value)}
                className="w-full lg:w-32 bg-[#F5F5F5] rounded-xl py-3 px-4 text-sm text-tracao-choco placeholder:text-tracao-choco-pale focus:outline-none focus:ring-2 focus:ring-tracao-cacao"
              />
            </div>
          </div>
        </div>
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
          </div>
        )}
      </div>

      {isCreating && (
        <CreateLotModal onClose={() => setIsCreating(false)} />
      )}
    </div>
  );
}


