"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeftIcon, ShieldCheckIcon, AlertTriangleIcon, CheckCircle2Icon, MapPinIcon, CalendarIcon, WeightIcon } from "lucide-react";
import { Button } from "../../components/ui/Button";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const batchNumber = searchParams.get("batch");
  
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (batchNumber) {
      verifyBatch();
    }
  }, [batchNumber]);

  const verifyBatch = async () => {
    setLoading(true);
    setError(null);
    try {
      const DJANGO_API_BASE = "https://tracoa.onrender.com/api";
      const res = await fetch(`${DJANGO_API_BASE}/tracability/verify/${batchNumber}`);
      if (!res.ok) throw new Error("Erreur de connexion au serveur de vérification.");
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!batchNumber) {
    return (
      <div className="p-10 text-center">
        <AlertTriangleIcon className="mx-auto text-tracao-error mb-4" size={48} />
        <h2 className="text-xl font-bold text-tracao-choco">Aucun numéro de lot fourni</h2>
        <Button onClick={() => router.push("/scanner")} className="mt-6">Retour au scanner</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 bg-[#0f0a07] min-h-screen overflow-y-auto pb-10 relative">
      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] bg-[#e2a856]/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[50%] h-[50%] bg-[#825026]/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 bg-tracao-cacao/80 backdrop-blur-md p-6 pt-10 text-white flex items-center justify-between shadow-lg border-b border-white/10">
        <div className="flex items-center">
          <button onClick={() => router.push("/")} className="p-2 -ml-2 rounded-full hover:bg-white/10 active:scale-95 transition-all">
            <ArrowLeftIcon size={24} />
          </button>
          <div className="ml-3">
            <h1 className="text-xl font-black tracking-tighter uppercase">Vérification <span className="text-[#e2a856]">Tracao</span></h1>
            <p className="text-[10px] font-bold text-white/50 tracking-[0.2em] uppercase">Authenticité Blockchain</p>
          </div>
        </div>
        <ShieldCheckIcon className="text-[#e2a856]" size={28} />
      </div>

      <div className="p-6 relative z-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-[#e2a856]/20 rounded-full"></div>
              <div className="absolute top-0 w-20 h-20 border-4 border-[#e2a856] border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-white font-black mt-8 text-xl tracking-tight">Interrogation de la blockchain...</p>
            <p className="text-xs text-white/40 mt-2 uppercase tracking-widest">Lot {batchNumber.substring(0, 8)}</p>
          </div>
        ) : error ? (
          <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-10 border border-white/10 text-center shadow-2xl">
            <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-red-500/20">
              <AlertTriangleIcon size={48} className="text-red-500" />
            </div>
            <h2 className="text-3xl font-black text-white mb-4 tracking-tighter uppercase">Vérification impossible</h2>
            <p className="text-white/60 mb-10 leading-relaxed font-medium">
              Nous n'avons pas pu authentifier ce lot. Il est possible qu'il ne soit pas encore synchronisé ou que le code soit expiré.
            </p>
            <button 
              onClick={verifyBatch}
              className="w-full py-5 bg-white text-black rounded-full font-black uppercase tracking-widest hover:bg-[#e2a856] transition-colors shadow-xl"
            >
              Réessayer la vérification
            </button>
          </div>
        ) : result?.is_authentic ? (
          <div className="animate-in fade-in zoom-in duration-700">
            <div className="bg-[#e2a856] text-[#0f0a07] rounded-[2.5rem] p-10 mb-8 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-[-20px] right-[-20px] w-60 h-60 bg-white/20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-[#0f0a07] rounded-[2rem] flex items-center justify-center text-[#e2a856] mb-8 shadow-2xl rotate-3 group-hover:rotate-6 transition-transform">
                  <CheckCircle2Icon size={56} />
                </div>
                <h2 className="text-4xl font-black mb-3 uppercase tracking-tighter leading-none">Produit <br/>Authentique</h2>
                <div className="flex items-center gap-2 px-6 py-2 bg-[#0f0a07]/10 rounded-full text-sm font-black backdrop-blur-md border border-[#0f0a07]/10">
                  <ShieldCheckIcon size={18} />
                  <span className="tracking-widest">SÉCURISÉ · TOGO</span>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/10 space-y-8 shadow-2xl mb-8">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h3 className="font-black text-white uppercase tracking-widest text-xs">Fiche d&apos;identité immuable</h3>
                <div className="w-2 h-2 rounded-full bg-[#e2a856] animate-ping" />
              </div>
              
              <div className="grid grid-cols-1 gap-6">
                <DataRow icon={<CalendarIcon size={20} className="text-[#e2a856]" />} label="Date de récolte" value={new Date(result.blockchain_data.timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} />
                <DataRow icon={<WeightIcon size={20} className="text-[#e2a856]" />} label="Poids Certifié" value={`${result.blockchain_data.weight} kg`} />
                <DataRow icon={<MapPinIcon size={20} className="text-[#e2a856]" />} label="Origine" value={result.blockchain_data.origin} />
                <DataRow icon={<ShieldCheckIcon size={20} className="text-[#e2a856]" />} label="Producteur" value={result.blockchain_data.producer_email} />
              </div>

              {result.certifications_obtenues?.length > 0 && (
                <div className="mt-10 pt-8 border-t border-white/5">
                  <h3 className="font-black text-white/40 uppercase tracking-widest text-[10px] mb-6">Certifications & Labels</h3>
                  <div className="flex flex-wrap gap-3">
                    {result.certifications_obtenues.map((cert: string, idx: number) => (
                      <span key={idx} className="bg-[#e2a856]/10 text-[#e2a856] font-black text-[10px] px-4 py-2 rounded-full border border-[#e2a856]/20 uppercase tracking-wider">
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4">
              <button 
                onClick={() => router.push("/")}
                className="w-full py-6 bg-white/5 text-white border border-white/10 rounded-full font-black uppercase tracking-widest hover:bg-white/10 transition-all"
              >
                Retour
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-10 border border-red-500/10 text-center shadow-2xl">
            <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-red-500/20">
              <AlertTriangleIcon size={48} className="text-red-500" />
            </div>
            <h2 className="text-3xl font-black text-white mb-4 tracking-tighter uppercase">Lot non authentifié</h2>
            <p className="text-white/60 mb-10 leading-relaxed font-medium">
              {result?.message || "Ce lot n'a pas pu être identifié sur la blockchain Tracao. Méfiez-vous des contrefaçons."}
            </p>
            <button 
              onClick={() => router.push("/scanner")}
              className="w-full py-5 bg-red-500 text-white rounded-full font-black uppercase tracking-widest hover:bg-red-600 transition-colors shadow-xl"
            >
              Scanner un autre lot
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function DataRow({ icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 bg-tracao-cream-light rounded-xl flex items-center justify-center text-tracao-cacao shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold text-tracao-choco-pale uppercase tracking-wide">{label}</p>
        <p className="text-sm font-bold text-tracao-choco leading-snug">{value}</p>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="p-6 text-tracao-choco">Chargement...</div>}>
      <VerifyContent />
    </Suspense>
  );
}
