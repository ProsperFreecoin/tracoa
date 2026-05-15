"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRightIcon, 
  LeafIcon, 
  CoffeeIcon, 
  BuildingIcon, 
  LandmarkIcon, 
  StoreIcon, 
  BriefcaseIcon,
  ChevronRightIcon,
  UsersIcon,
  MapPinIcon,
  TrendingUpIcon,
  ChevronDownIcon,
  ShieldCheckIcon
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  
  const accountTypes = [
    { id: "Agriculteur", label: "Agriculteur", icon: <LeafIcon size={24} />, description: "Producteur de cacao ou café" },
    { id: "Acheteur Privé", label: "Acheteur Privé", icon: <BriefcaseIcon size={24} />, description: "Négociant ou Exportateur" },
    { id: "Entreprise de Transformation", label: "Transformateur", icon: <BuildingIcon size={24} />, description: "Usine de transformation locale" },
    { id: "Institution", label: "Institution", icon: <LandmarkIcon size={24} />, description: "Organisme de régulation" },
    { id: "Magasin/Boutique", label: "Distributeur", icon: <StoreIcon size={24} />, description: "Vente au détail ou stockage" },
  ];

  const handleSelectType = (type: string) => {
    router.push(`/register?type=${encodeURIComponent(type)}`);
  };

  if (step === 2) {
    return (
      <div className="relative min-h-screen bg-[#0f0a07] flex flex-col items-center justify-center p-6 font-sans overflow-hidden">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: "url('/welcome-bg.png')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f0a07] via-transparent to-[#0f0a07]" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-full max-w-lg"
        >
          <div className="text-center mb-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 bg-[#e2a856] rounded-full mx-auto mb-4 flex items-center justify-center shadow-[0_0_20px_rgba(226,168,86,0.5)]"
            >
              <UsersIcon className="text-[#0f0a07]" size={32} />
            </motion.div>
            <h2 className="text-4xl font-black text-white mb-3 tracking-tighter uppercase">CRÉER UN COMPTE</h2>
            <p className="text-white/60 text-lg font-medium">Choisissez votre rôle dans la chaîne</p>
          </div>

          <div className="grid gap-3 overflow-y-auto max-h-[50vh] pr-2 custom-scrollbar">
            {accountTypes.map((type, index) => (
              <motion.button
                key={type.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleSelectType(type.id)}
                className="flex items-center p-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl hover:bg-white/10 hover:border-[#e2a856]/50 transition-all text-left group relative overflow-hidden"
              >
                <div className="w-12 h-12 rounded-xl bg-[#825026]/40 flex items-center justify-center text-[#e2a856] group-hover:scale-110 transition-transform">
                  {type.icon}
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-bold text-white text-lg leading-tight">{type.label}</h3>
                  <p className="text-white/40 text-xs mt-0.5">{type.description}</p>
                </div>
                <ChevronRightIcon className="text-white/20 group-hover:text-[#e2a856] group-hover:translate-x-1 transition-all" size={24} />
              </motion.button>
            ))}
          </div>

          <button
            onClick={() => setStep(1)}
            className="mt-8 w-full py-4 text-white/50 hover:text-white transition-colors text-base font-bold flex items-center justify-center gap-3 bg-white/5 rounded-2xl border border-white/5"
          >
            <ArrowRightIcon className="rotate-180 w-5 h-5" />
            RETOUR AUX INFOS
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-[#0f0a07] text-white font-sans selection:bg-[#e2a856] selection:text-[#0f0a07]">
      {/* SECTION 1: HERO & CONTEXT - FULL SCREEN */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-10 py-20 overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: [1.1, 1.02, 1.1] }}
          transition={{ opacity: { duration: 1.5 }, scale: { duration: 25, repeat: Infinity, ease: "linear" } }}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/welcome-bg.png')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f0a07]/40 via-[#0f0a07]/90 to-[#0f0a07]" />
        
        <div className="relative z-10 w-full text-center">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: [0, -10, 0], opacity: 1 }}
            transition={{ y: { duration: 4, repeat: Infinity, ease: "easeInOut" }, opacity: { duration: 1 } }}
            className="inline-block px-6 py-2 rounded-full bg-[#e2a856]/10 border border-[#e2a856]/20 text-[#e2a856] text-sm font-black tracking-[0.3em] uppercase mb-10"
          >
            L&apos;EXCELLENCE TOGOLAISE
          </motion.div>
          
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-7xl md:text-[10rem] lg:text-[13rem] font-black mb-10 tracking-tighter leading-[0.8] uppercase"
          >
            CACAO <span className="text-transparent border-text-white">&amp;</span> CAFÉ <br/>
            <span className="text-[#e2a856]">DU TOGO</span>
          </motion.h1>

          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-2xl md:text-4xl text-white/80 w-full max-w-none mx-auto mb-16 font-medium leading-tight px-4"
          >
            <p className="mb-8">
              Aujourd&apos;hui, la filière café-cacao représente un <span className="text-white font-black underline decoration-[#e2a856] decoration-4 underline-offset-8">levier important</span> de développement rural.
            </p>
            <p className="text-white/50 text-xl md:text-2xl">
              Elle mobilise plusieurs centaines de milliers de producteurs, principalement dans les régions forestières du pays.
            </p>
          </motion.div>

          <motion.button 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.05, boxShadow: "0 20px 60px rgba(130,80,38,0.6)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setStep(2)}
            className="px-20 py-8 bg-[#825026] text-white font-black text-3xl rounded-full transition-all shadow-[0_20px_60px_rgba(130,80,38,0.3)] flex items-center justify-center gap-4 group mx-auto"
          >
            DÉMARRER <ArrowRightIcon size={32} className="group-hover:translate-x-3 transition-transform" />
          </motion.button>
        </div>

        <motion.div 
          animate={{ y: [0, 15, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 opacity-20"
        >
          <ChevronDownIcon size={40} />
        </motion.div>
      </section>

      {/* SECTION 2: STATS - FILLING SCREEN */}
      <section className="py-32 px-10 w-full">
        <div className="w-full">
          <motion.h2 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-6xl md:text-8xl font-black mb-20 tracking-tighter leading-none uppercase text-center"
          >
            ÉTAT DE LA <span className="text-[#e2a856]">FILIÈRE AU TOGO</span>
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
            <StatCard 
              index={0}
              icon={<UsersIcon size={40} className="text-[#e2a856]" />} 
              value="400K" 
              label="PRODUCTEURS" 
              detail="Plus de 40 000 familles dépendant du café-cacao comme source de revenus principale au Togo."
            />
            <StatCard 
              index={1}
              icon={<MapPinIcon size={40} className="text-[#e2a856]" />} 
              value="72 762" 
              label="HECTARES" 
              detail="45 117 ha consacrés au café et 27 645 ha au cacao dans les zones forestières du pays."
            />
            <StatCard 
              index={2}
              icon={<TrendingUpIcon size={40} className="text-[#e2a856]" />} 
              value="1,4%" 
              label="DU PIB" 
              detail="La filière représente 5,5% de la valeur agricole nationale, un poids économique majeur."
            />
            <StatCard 
              index={3}
              icon={<ShieldCheckIcon size={40} className="text-[#e2a856]" />} 
              value="100%" 
              label="TRAÇABILITÉ" 
              detail="La contribution au PIB joue un rôle clé dans les exportations vers l'international."
            />
          </div>
        </div>
      </section>

      <section className="py-32 px-10 text-center relative overflow-hidden bg-white/5 backdrop-blur-lg border-y border-white/10">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 bg-[#825026]/10 blur-[150px] rounded-full translate-y-1/2" 
        />
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="w-full relative z-10"
        >
          <h2 className="text-7xl md:text-9xl font-black mb-10 tracking-tighter leading-none uppercase">
            REJOIGNEZ <br/>
            <span className="text-[#e2a856]">L&apos;ÉCOSYSTÈME</span>
          </h2>
          <p className="text-2xl md:text-3xl text-white/60 mb-16 max-w-5xl mx-auto font-medium">
            Que vous soyez agriculteur, acheteur ou régulateur, Tracao est l&apos;outil dont vous avez besoin pour valoriser la filière.
          </p>
          <motion.button 
            whileHover={{ scale: 1.05, boxShadow: "0 0 50px rgba(226,168,86,0.3)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setStep(2)}
            className="px-24 py-10 bg-white text-[#0f0a07] font-black text-4xl rounded-full hover:bg-[#e2a856] transition-colors uppercase relative overflow-hidden group"
          >
            <motion.div 
              className="absolute inset-0 bg-white/20 w-full"
              initial={{ x: "-100%" }}
              whileHover={{ x: "100%" }}
              transition={{ duration: 0.5 }}
            />
            CRÉER MON COMPTE
          </motion.button>
        </motion.div>
      </section>

      <footer className="py-16 px-10 border-t border-white/5 text-center text-white/20 text-base font-black uppercase tracking-[0.4em]">
        &copy; 2024 TRACAO · L&apos;HÉRITAGE DE LA TERRE TOGOLAISE
      </footer>
    </div>
  );
}

function StatCard({ icon, value, label, detail, index = 0 }: { icon: any, value: string, label: string, detail: string, index?: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.15 }}
      whileHover={{ scale: 1.03, backgroundColor: "rgba(255, 255, 255, 0.08)", y: -10 }}
      className="bg-white/5 border border-white/10 p-12 rounded-[3rem] transition-colors flex flex-col items-center text-center h-full relative group overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-t from-[#e2a856]/0 to-[#e2a856]/0 group-hover:to-[#e2a856]/5 transition-colors" />
      <div className="mb-8 scale-[1.5] group-hover:scale-[1.7] transition-transform">
        {icon}
      </div>
      <div className="text-7xl font-black mb-4 tracking-tighter">{value}</div>
      <div className="text-sm font-black text-[#e2a856] tracking-[0.3em] uppercase mb-6">{label}</div>
      <p className="text-lg text-white/40 leading-tight font-medium">{detail}</p>
    </motion.div>
  );
}
