"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { 
  ArrowRightIcon, 
  LeafIcon, 
  CoffeeIcon, 
  BuildingIcon, 
  LandmarkIcon, 
  StoreIcon, 
  BriefcaseIcon,
  ChevronRightIcon,
  ShieldCheckIcon,
  GlobeIcon,
  BarChart3Icon
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [counter1, setCounter1] = useState(0);
  const [counter2, setCounter2] = useState(0);

  // Counter animations
  useEffect(() => {
    if (step === 1) {
      const timer1 = setInterval(() => {
        setCounter1(prev => (prev < 90 ? prev + 1 : 90));
      }, 30);
      const timer2 = setInterval(() => {
        setCounter2(prev => (prev < 100 ? prev + 2 : 100));
      }, 20);
      return () => {
        clearInterval(timer1);
        clearInterval(timer2);
      };
    }
  }, [step]);

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

  return (
    <div className="relative min-h-screen bg-[#0f0a07] overflow-x-hidden flex flex-col items-center justify-center font-sans">
      {/* Background Image with Overlay */}
      <motion.div 
        initial={{ scale: 1.2, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 2 }}
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/welcome-bg.png')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f0a07]/20 via-[#0f0a07]/70 to-[#0f0a07]" />

      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="absolute top-0 left-0 right-0 z-20 p-8"
      >
        {/* Header empty of text/logo as requested */}
      </motion.header>

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
            key="step1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative z-10 w-full max-w-5xl px-6 py-12 flex flex-col items-center"
          >
            
            {/* Main Headline - EXTRA LARGE */}
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-6xl md:text-8xl font-black text-white mb-8 tracking-tighter text-center leading-none"
            >
              RÉVOLUTION <br/>
              <span className="text-[#e2a856] drop-shadow-sm">TRAÇABLE</span>
            </motion.h1>
            
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="space-y-6 text-xl md:text-2xl text-white/90 leading-tight mb-12 max-w-2xl text-center font-medium"
            >
              <p>
                Le monde exige de la <span className="text-[#e2a856] font-extrabold underline decoration-[#e2a856]/30 underline-offset-8">transparence</span>. 
                Tracao offre la preuve immuable de l'origine de votre <span className="font-bold">Cacao</span> et <span className="font-bold">Café</span>.
              </p>
            </motion.div>

            {/* Stats Cards - CHIFFRES CLES */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 w-full max-w-4xl">
              <StatItem 
                icon={<GlobeIcon className="text-[#e2a856]" size={24} />} 
                value={`${counter1}%`} 
                label="CONFORMITÉ EUDR" 
                detail="D'ici 2025 pour l'accès au marché européen."
              />
              <StatItem 
                icon={<ShieldCheckIcon className="text-[#e2a856]" size={24} />} 
                value={`${counter2}%`} 
                label="SÉCURITÉ BLOCKCHAIN" 
                detail="Données inaltérables de la fève à la tasse."
              />
              <StatItem 
                icon={<BarChart3Icon className="text-[#e2a856]" size={24} />} 
                value="42K+" 
                label="PRODUCTEURS VISÉS" 
                detail="Une identité numérique pour chaque agriculteur."
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setStep(2)}
              className="group relative inline-flex items-center justify-center px-12 py-5 font-black text-xl text-white transition-all duration-300 bg-[#825026] rounded-full hover:bg-[#a66a3a] shadow-[0_0_40px_rgba(130,80,38,0.4)]"
            >
              DÉMARRER MAINTENANT
              <ArrowRightIcon className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </motion.button>

            <div className="mt-16 flex justify-center gap-12 border-t border-white/10 pt-10 w-full">
              <FeatureMini icon={<CoffeeIcon />} label="Café Togo" />
              <FeatureMini icon={<LeafIcon />} label="Cacao Premium" />
              <FeatureMini icon={<LandmarkIcon />} label="Certifié EUDR" />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="step2"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative z-10 w-full max-w-lg px-6"
          >
            <div className="text-center mb-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-16 h-16 bg-[#e2a856] rounded-full mx-auto mb-4 flex items-center justify-center shadow-[0_0_20px_rgba(226,168,86,0.5)]"
              >
                <UserIcon className="text-[#0f0a07]" size={32} />
              </motion.div>
              <h2 className="text-4xl font-black text-white mb-3">CRÉER UN COMPTE</h2>
              <p className="text-white/60 text-lg">Identifiez votre rôle dans la chaîne</p>
            </div>

            <div className="grid gap-4 overflow-y-auto max-h-[50vh] pr-2 custom-scrollbar">
              {accountTypes.map((type, index) => (
                <motion.button
                  key={type.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleSelectType(type.id)}
                  className="flex items-center p-5 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl hover:bg-white/10 hover:border-[#e2a856]/50 transition-all text-left group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#e2a856]/0 to-[#e2a856]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-14 h-14 rounded-xl bg-[#825026]/40 flex items-center justify-center text-[#e2a856] group-hover:rotate-6 transition-transform">
                    {type.icon}
                  </div>
                  <div className="ml-5 flex-1">
                    <h3 className="font-bold text-white text-lg">{type.label}</h3>
                    <p className="text-white/40 text-sm">{type.description}</p>
                  </div>
                  <ChevronRightIcon className="text-white/20 group-hover:text-[#e2a856] group-hover:translate-x-2 transition-all" size={24} />
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

            <div className="mt-8 flex items-center justify-center gap-4 bg-black/40 p-4 rounded-2xl border border-white/10">
               <p className="text-white/60 text-sm">Déjà membre ?</p>
               <Link href="/login" className="px-6 py-2 bg-[#e2a856] text-[#0f0a07] font-black rounded-lg hover:bg-white transition-colors text-sm uppercase">
                 Connexion
               </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#e2a856]/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#825026]/10 blur-[150px] rounded-full translate-y-1/3 -translate-x-1/4" />
    </div>
  );
}

function StatItem({ icon, value, label, detail }: { icon: any, value: string, label: string, detail: string }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl text-center"
    >
      <div className="w-12 h-12 bg-[#e2a856]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
        {icon}
      </div>
      <div className="text-4xl font-black text-white mb-1">{value}</div>
      <div className="text-[10px] font-bold text-[#e2a856] tracking-[2px] uppercase mb-2">{label}</div>
      <p className="text-[11px] text-white/50 leading-tight">{detail}</p>
    </motion.div>
  );
}

function FeatureMini({ icon, label }: { icon: any, label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 group">
      <div className="text-white/40 group-hover:text-[#e2a856] transition-colors scale-125">
        {icon}
      </div>
      <span className="text-[10px] font-black text-white/30 uppercase tracking-widest group-hover:text-white transition-colors">{label}</span>
    </div>
  );
}

function UserIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  );
}
