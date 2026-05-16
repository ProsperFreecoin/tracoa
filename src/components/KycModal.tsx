"use client";

import { useState, useRef } from "react";
import { XIcon, CameraIcon, CheckCircle2Icon, AlertCircleIcon, UploadCloudIcon, ImageIcon, ChevronRightIcon } from "lucide-react";
import { uploadImage, validateImageFile } from "../lib/cloudinary";
import { useAgriculteur } from "../context/AgriculteurContext";

type KycType = "cni" | "passport";

export function KycModal({ onClose }: { onClose: () => void }) {
  const { mettreAJourProfil } = useAgriculteur();
  const [step, setStep] = useState(1); // 1: Type, 2: Info, 3: Photos, 4: Success
  const [docType, setDocType] = useState<KycType | null>(null);
  
  // Form state
  const [docNumber, setDocNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  
  // Photos state
  const [rectoFile, setRectoFile] = useState<File | null>(null);
  const [rectoPreview, setRectoPreview] = useState<string | null>(null);
  const [versoFile, setVersoFile] = useState<File | null>(null);
  const [versoPreview, setVersoPreview] = useState<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const rectoInputRef = useRef<HTMLInputElement>(null);
  const versoInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = (file: File, side: "recto" | "verso") => {
    const err = validateImageFile(file, 5);
    if (err) {
      alert(err);
      return;
    }
    const preview = URL.createObjectURL(file);
    if (side === "recto") {
      setRectoFile(file);
      setRectoPreview(preview);
    } else {
      setVersoFile(file);
      setVersoPreview(preview);
    }
  };

  const handleSubmit = async () => {
    if (!rectoFile || (docType === "cni" && !versoFile)) return;
    
    setIsSubmitting(true);
    setUploadProgress(10);
    
    try {
      // 1. Upload Recto
      const rectoRes = await uploadImage(rectoFile, "tracao/kyc");
      setUploadProgress(50);
      
      let versoUrl = "";
      if (versoFile) {
        // 2. Upload Verso
        const versoRes = await uploadImage(versoFile, "tracao/kyc");
        versoUrl = versoRes.secure_url;
      }
      setUploadProgress(90);

      // 3. Update Profil
      await mettreAJourProfil({
        kycStatut: "en_attente",
        kycDocumentUrl: rectoRes.secure_url,
        kycDocumentVersoUrl: versoUrl || undefined,
        kycSoumisLe: new Date().toISOString(),
      });

      setUploadProgress(100);
      setStep(4);
    } catch (e) {
      console.error("Erreur soumission KYC:", e);
      alert("Une erreur est survenue lors de l'envoi de vos documents.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end lg:items-center justify-center p-0 lg:p-4 animate-in fade-in duration-300">
      <div className="bg-tracao-cream-light w-full max-w-md rounded-t-[2.5rem] lg:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-20 duration-500 max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 pb-2 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black text-tracao-choco">Vérification KYC</h3>
            <p className="text-[10px] text-tracao-choco-pale font-bold uppercase tracking-widest mt-0.5">Sécurisation de votre compte</p>
          </div>
          <button onClick={onClose} className="p-2 bg-tracao-cream-mid rounded-full text-tracao-choco-pale hover:text-tracao-choco transition-colors">
            <XIcon size={20} />
          </button>
        </div>

        {/* Progress Bar (if step < 4) */}
        {step < 4 && (
          <div className="px-6 py-2">
            <div className="h-1.5 w-full bg-tracao-cream-mid rounded-full overflow-hidden">
              <div 
                className="h-full bg-tracao-cacao transition-all duration-500 ease-out"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="p-6 overflow-y-auto">
          
          {/* STEP 1: Select Doc Type */}
          {step === 1 && (
            <div className="animate-in slide-in-from-right duration-300">
              <p className="text-sm text-tracao-choco-light mb-6 font-medium">Choisissez le type de document que vous souhaitez utiliser pour vérifier votre identité.</p>
              
              <div className="space-y-3">
                <button 
                  onClick={() => { setDocType("cni"); setStep(2); }}
                  className="w-full p-4 rounded-2xl bg-white border border-tracao-border hover:border-tracao-cacao group transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-tracao-cream-mid flex items-center justify-center text-tracao-cacao group-hover:scale-110 transition-transform">
                      <ImageIcon size={24} />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-tracao-choco">Carte d'Identité</p>
                      <p className="text-[10px] text-tracao-choco-pale uppercase font-semibold">National ID / CNI</p>
                    </div>
                  </div>
                  <ChevronRightIcon size={20} className="text-tracao-choco-pale group-hover:text-tracao-cacao transition-colors" />
                </button>

                <button 
                  onClick={() => { setDocType("passport"); setStep(2); }}
                  className="w-full p-4 rounded-2xl bg-white border border-tracao-border hover:border-tracao-cacao group transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-tracao-cream-mid flex items-center justify-center text-tracao-cacao group-hover:scale-110 transition-transform">
                      <UploadCloudIcon size={24} />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-tracao-choco">Passeport</p>
                      <p className="text-[10px] text-tracao-choco-pale uppercase font-semibold">Passeport International</p>
                    </div>
                  </div>
                  <ChevronRightIcon size={20} className="text-tracao-choco-pale group-hover:text-tracao-cacao transition-colors" />
                </button>
              </div>

              <div className="mt-8 p-4 bg-tracao-cream-mid rounded-2xl flex gap-3 items-start">
                <AlertCircleIcon size={18} className="text-tracao-choco-pale shrink-0 mt-0.5" />
                <p className="text-[11px] text-tracao-choco-pale leading-relaxed font-medium">
                  Vos documents sont stockés de manière sécurisée et ne sont utilisés que pour la validation de votre identité par nos services agréés.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: Fill Info */}
          {step === 2 && (
            <div className="animate-in slide-in-from-right duration-300">
              <p className="text-sm text-tracao-choco-light mb-6 font-medium">
                Veuillez renseigner les informations de votre {docType === "cni" ? "carte d'identité" : "passeport"}.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-tracao-choco-pale uppercase tracking-widest mb-1.5 ml-1">Numéro du document</label>
                  <input 
                    type="text" 
                    value={docNumber} 
                    onChange={(e) => setDocNumber(e.target.value)}
                    placeholder="Ex: 0123456789"
                    className="w-full bg-white border border-tracao-border rounded-xl py-3.5 px-4 text-sm font-semibold text-tracao-choco focus:outline-none focus:border-tracao-cacao focus:ring-1 focus:ring-tracao-cacao"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-tracao-choco-pale uppercase tracking-widest mb-1.5 ml-1">Date d'expiration</label>
                  <input 
                    type="date" 
                    value={expiryDate} 
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full bg-white border border-tracao-border rounded-xl py-3.5 px-4 text-sm font-semibold text-tracao-choco focus:outline-none focus:border-tracao-cacao focus:ring-1 focus:ring-tracao-cacao"
                  />
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button 
                  onClick={() => setStep(1)}
                  className="flex-1 py-4 bg-tracao-cream-mid text-tracao-choco rounded-2xl font-bold hover:bg-tracao-border transition-colors"
                >
                  Retour
                </button>
                <button 
                  onClick={() => setStep(3)}
                  disabled={!docNumber || !expiryDate}
                  className="flex-[2] py-4 bg-tracao-cacao text-white rounded-2xl font-bold hover:bg-tracao-cacao/90 disabled:opacity-50 transition-all"
                >
                  Continuer
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Photos */}
          {step === 3 && (
            <div className="animate-in slide-in-from-right duration-300">
              <p className="text-sm text-tracao-choco-light mb-6 font-medium">
                Importez les photos de votre document. Assurez-vous que le texte soit lisible.
              </p>

              <div className="grid grid-cols-2 gap-4">
                {/* Recto */}
                <div>
                  <label className="block text-[10px] font-bold text-tracao-choco-pale uppercase tracking-widest mb-2 text-center">Recto (Face)</label>
                  <div 
                    onClick={() => rectoInputRef.current?.click()}
                    className={`relative w-full aspect-[4/3] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all ${rectoPreview ? "border-tracao-cacao bg-white" : "border-tracao-border bg-white hover:border-tracao-cacao hover:bg-tracao-cream"}`}
                  >
                    {rectoPreview ? (
                      <>
                        <img src={rectoPreview} alt="Recto" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <CameraIcon className="text-white" size={24} />
                        </div>
                      </>
                    ) : (
                      <>
                        <CameraIcon className="text-tracao-choco-pale mb-2" size={24} />
                        <span className="text-[10px] font-bold text-tracao-choco-pale uppercase tracking-wider">Cliquez</span>
                      </>
                    )}
                  </div>
                  <input ref={rectoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoSelect(f, "recto"); }} />
                </div>

                {/* Verso (only for CNI) */}
                {docType === "cni" && (
                  <div>
                    <label className="block text-[10px] font-bold text-tracao-choco-pale uppercase tracking-widest mb-2 text-center">Verso (Dos)</label>
                    <div 
                      onClick={() => versoInputRef.current?.click()}
                      className={`relative w-full aspect-[4/3] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all ${versoPreview ? "border-tracao-cacao bg-white" : "border-tracao-border bg-white hover:border-tracao-cacao hover:bg-tracao-cream"}`}
                    >
                      {versoPreview ? (
                        <>
                          <img src={versoPreview} alt="Verso" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <CameraIcon className="text-white" size={24} />
                          </div>
                        </>
                      ) : (
                        <>
                          <CameraIcon className="text-tracao-choco-pale mb-2" size={24} />
                          <span className="text-[10px] font-bold text-tracao-choco-pale uppercase tracking-wider">Cliquez</span>
                        </>
                      )}
                    </div>
                    <input ref={versoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoSelect(f, "verso"); }} />
                  </div>
                )}
              </div>

              <div className="mt-8 flex flex-col gap-3">
                <button 
                  disabled={isSubmitting || !rectoFile || (docType === "cni" && !versoFile)}
                  onClick={handleSubmit}
                  className="w-full py-4 bg-tracao-cacao text-white rounded-2xl font-bold hover:bg-tracao-cacao/90 disabled:opacity-50 transition-all flex items-center justify-center gap-3 shadow-lg"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Envoi en cours ({uploadProgress}%)</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2Icon size={20} />
                      <span>Soumettre mon KYC</span>
                    </>
                  )}
                </button>
                <button 
                  disabled={isSubmitting}
                  onClick={() => setStep(2)}
                  className="w-full py-4 bg-tracao-cream-mid text-tracao-choco rounded-2xl font-bold hover:bg-tracao-border transition-colors"
                >
                  Retour
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Success */}
          {step === 4 && (
            <div className="animate-in zoom-in-95 duration-500 py-4 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-tracao-forest-light rounded-full flex items-center justify-center mb-6 shadow-sm">
                <CheckCircle2Icon size={40} className="text-tracao-forest" />
              </div>
              <h4 className="text-xl font-black text-tracao-choco mb-2">Documents reçus !</h4>
              <p className="text-sm text-tracao-choco-light mb-8 font-medium leading-relaxed">
                Votre demande de vérification KYC a été soumise avec succès. Nos services vont examiner vos documents sous 24h à 48h.
              </p>
              
              <div className="w-full p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3 items-center mb-8">
                <ClockIcon size={20} className="text-amber-600 shrink-0" />
                <p className="text-xs text-amber-700 font-bold text-left">Statut : Vérification en cours</p>
              </div>

              <button 
                onClick={onClose}
                className="w-full py-4 bg-tracao-cacao text-white rounded-2xl font-bold hover:bg-tracao-choco shadow-lg transition-all"
              >
                Retour au profil
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper icons
function ClockIcon({ size = 20, className = "" }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
