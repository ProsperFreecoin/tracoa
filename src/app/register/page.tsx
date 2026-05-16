"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAgriculteur } from "../../context/AgriculteurContext";
import { uploadImage, validateImageFile } from "../../lib/cloudinary";
import { registerUser, verifyOTP, uploadKYC } from "../../lib/djangoApi";
import {
  ChevronDownIcon, XIcon, UserIcon, MailIcon, LockIcon,
  CameraIcon, IdCardIcon, CheckCircle2Icon, AlertCircleIcon,
  ArrowLeftIcon, UploadCloudIcon, EyeIcon, EyeOffIcon, KeyIcon,
  BuildingIcon, LandmarkIcon, StoreIcon, BriefcaseIcon
} from "lucide-react";

const TOTAL_STEPS = 5;

const STEP_LABELS = [
  "Identité",
  "Compte",
  "Vérification",
  "Photo",
  "KYC",
];

const secteurs = [
  "Agriculteur",
  "Acheteur Privé",
  "Entreprise de Transformation",
  "Institution",
  "Magasin/Boutique"
];

export default function RegisterScreen() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-tracao-cream flex items-center justify-center font-bold">Chargement...</div>}>
      <RegisterContent />
    </Suspense>
  );
}

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { connecter } = useAgriculteur();

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Étape 1 — Identité (Champs communs)
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [region, setRegion] = useState("");
  const [secteur, setSecteur] = useState("Agriculteur");
  
  // Agriculteur spécifique
  const [typeAgriculteur, setTypeAgriculteur] = useState<"Indépendant" | "Coopérative">("Indépendant");
  const [coopName, setCoopName] = useState("");

  useEffect(() => {
    const type = searchParams.get("type");
    if (type && secteurs.includes(type)) {
      setSecteur(type);
    }
  }, [searchParams]);

  // Champs spécifiques Organisation
  const [orgName, setOrgName] = useState("");
  const [personToCall, setPersonToCall] = useState("");
  const [ptcNumber, setPtcNumber] = useState("");
  const [address, setAddress] = useState("");
  const [country, setCountry] = useState("Togo");
  
  // Entreprise
  const [recordNumber, setRecordNumber] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  
  // Institution
  const [legalNumber, setLegalNumber] = useState("");
  const [website, setWebsite] = useState("");
  
  // Magasin
  const [storeName, setStoreName] = useState("");
  const [storeAddress, setStoreAddress] = useState("");

  const [certificationFile, setCertificationFile] = useState<File | null>(null);

  // Étape 2 — Compte
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Étape 3 — OTP
  const [otpCode, setOtpCode] = useState("");

  // Étape 4 — Photo de profil
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Étape 5 — KYC
  const [kycRectoFile, setKycRectoFile] = useState<File | null>(null);
  const [kycRectoPreview, setKycRectoPreview] = useState<string | null>(null);
  const [kycVersoFile, setKycVersoFile] = useState<File | null>(null);
  const [kycVersoPreview, setKycVersoPreview] = useState<string | null>(null);
  const [kycSelfieFile, setKycSelfieFile] = useState<File | null>(null);
  const [kycSelfiePreview, setKycSelfiePreview] = useState<string | null>(null);
  const [kycConfirmed, setKycConfirmed] = useState(false);
  
  const kycRectoRef = useRef<HTMLInputElement>(null);
  const kycVersoRef = useRef<HTMLInputElement>(null);
  const kycSelfieRef = useRef<HTMLInputElement>(null);

  const [djangoUserId, setDjangoUserId] = useState<number | null>(null);

  const handleFileSelect = (
    file: File,
    setFile: (f: File) => void,
    setPreview: (url: string) => void,
  ) => {
    const err = validateImageFile(file, 15);
    if (err) { setError(err); return; }
    setError("");
    setFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const goNext = () => { setError(""); setStep((s) => s + 1); };
  const goBack = () => { setError(""); setStep((s) => s - 1); };

  /* ── Validation étape 1 ── */
  const validateStep1 = () => {
    if (secteur === "Agriculteur" || secteur === "Acheteur Privé") {
      if (!prenom.trim() || !nom.trim()) { setError("Prénom et nom obligatoires."); return false; }
    } else {
      if (!(orgName || storeName).trim()) { setError("Le nom de l'organisation est obligatoire."); return false; }
      if (!personToCall.trim()) { setError("Le nom de la personne à contacter est obligatoire."); return false; }
      if (!ptcNumber.trim()) { setError("Le numéro de la personne à contacter est obligatoire."); return false; }
    }
    
    if (secteur === "Agriculteur" && typeAgriculteur === "Coopérative" && !coopName.trim()) {
      setError("Veuillez préciser le nom de votre coopérative.");
      return false;
    }
    
    // Validation téléphone
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    const contactPhone = secteur === "Agriculteur" || secteur === "Acheteur Privé" ? telephone : ptcNumber;
    const cleanPhone = contactPhone.replace(/\s/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      setError("Le téléphone doit être au format international (ex: +22890000000).");
      return false;
    }
    
    return true;
  };

  /* ── Validation étape 2 ── */
  const validateStep2 = () => {
    if (!email.includes("@")) { setError("Email invalide."); return false; }
    if (password.length < 6) { setError("Mot de passe : 6 caractères minimum."); return false; }
    if (password !== confirmPassword) { setError("Les mots de passe ne correspondent pas."); return false; }
    return true;
  };

  /* ── Inscription Backend (Django) ── */
  const handleSignup = async () => {
    if (!validateStep2()) return;
    setIsLoading(true);
    setError("");

    try {
      let userData: any = {
        email,
        password,
        confirm_password: confirmPassword,
        phone_number: telephone || ptcNumber,
      };

      if (secteur === "Agriculteur" || secteur === "Acheteur Privé") {
        userData = { ...userData, first_name: prenom, last_name: nom, situation_geo: region || "Lome" };
        if (secteur === "Agriculteur") {
          userData.is_farmer = true;
          if (typeAgriculteur === "Coopérative" && coopName) {
            userData.cooperative_name = coopName;
          }
        }
      } else if (secteur === "Entreprise de Transformation") {
        userData = { ...userData, org_name: orgName, person_to_call: personToCall, ptc_number: ptcNumber, record_number: recordNumber, tax_number: taxNumber, address, country };
      } else if (secteur === "Institution") {
        userData = { ...userData, org_name: orgName, person_to_call: personToCall, ptc_number: ptcNumber, legal_number: legalNumber, website, address, country };
      } else if (secteur === "Magasin/Boutique") {
        userData = { ...userData, store_name: storeName, store_address: storeAddress, person_to_call: personToCall, ptc_number: ptcNumber, address, country };
      }

      const res = await registerUser(userData, secteur, certificationFile || undefined);
      setDjangoUserId(res.id);
      goNext(); // Vers Step 3 : OTP
    } catch (err: any) {
      let msg = "Erreur lors de l'inscription.";
      const rawMsg = err.message || "";
      
      try {
        // Tenter de parser si c'est du JSON
        if (rawMsg.startsWith("{") || rawMsg.startsWith("[")) {
          const errorData = JSON.parse(rawMsg);
          if (errorData.email) msg = "Cet email est déjà utilisé.";
          else if (errorData.detail) msg = errorData.detail;
          else msg = Object.values(errorData).flat().join(" ");
        } else {
          // Sinon afficher le message brut (ex: Erreur 500, HTML, etc)
          msg = rawMsg || msg;
        }
      } catch (e) {
        msg = rawMsg || msg;
      }
      setError(msg);
      console.error("Signup Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Vérification OTP ── */
  const handleVerifyOTP = async () => {
    if (otpCode.length < 6) { setError("Code invalide."); return; }
    setIsLoading(true);
    setError("");

    try {
      await verifyOTP(email, otpCode);
      goNext(); // Vers Step 4 : Photo
    } catch (err: any) {
      setError(err.message || "Code incorrect ou expiré.");
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Soumission finale (étape 5) ── */
  const handleSubmitKYC = async () => {
    if (!kycRectoFile || !kycVersoFile || !kycSelfieFile) { 
      setError("Veuillez ajouter tous les documents KYC requis."); 
      return; 
    }
    if (!kycConfirmed) { setError("Veuillez confirmer que vos informations sont exactes."); return; }
    if (!djangoUserId) { setError("ID utilisateur manquant."); return; }
    
    setIsLoading(true);
    setError("");

    try {
      // 1. Upload KYC vers Django
      await uploadKYC(djangoUserId, kycRectoFile, kycVersoFile, kycSelfieFile);

      // 2. Upload photo de profil vers Cloudinary (optionnel)
      let photoUrl: string | undefined;
      if (photoFile) {
        const res = await uploadImage(photoFile, "tracao/profils", setUploadProgress);
        photoUrl = res.secure_url;
      }

      // 3. Finaliser localement
      await connecter({
        id: djangoUserId.toString(),
        djangoId: djangoUserId,
        nom: nom || orgName || storeName,
        prenom: prenom || personToCall,
        email,
        telephone: telephone || ptcNumber,
        region: region || address || storeAddress,
        secteur,
        certifie: false,
        photoUrl,
        kycStatut: "en_attente",
      });

      router.push("/");
    } catch (err: any) {
      setError("Erreur lors de la soumission du KYC.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-tracao-cream p-5 pt-20 relative">
      {/* Header Logo */}
      <Link href="/" className="absolute top-6 left-6 p-2 rounded-full hover:bg-tracao-cacao/10 transition-colors text-tracao-cacao" title="Retour à l'accueil">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
      </Link>

      {/* Title */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-black text-tracao-choco mt-2">Créer mon compte</h1>
        <p className="text-sm text-tracao-choco-pale mt-1">Étape {step} sur {TOTAL_STEPS}</p>
      </div>

      {/* Barre de progression */}
      <div className="flex items-center gap-1 mb-6">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <div key={i} className="flex items-center flex-1">
            <div className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${i < step ? "bg-tracao-cacao" : "bg-tracao-border"}`} />
            {i < TOTAL_STEPS - 1 && <div className="w-1" />}
          </div>
        ))}
      </div>

      {/* Labels d'étape */}
      <div className="flex justify-between mb-6 px-1 overflow-hidden">
        {STEP_LABELS.map((label, i) => (
          <span key={i} className={`text-[9px] font-bold uppercase tracking-wide ${i + 1 === step ? "text-tracao-cacao" : i + 1 < step ? "text-tracao-choco-light" : "text-tracao-border"}`}>
            {label}
          </span>
        ))}
      </div>

      {/* Carte de contenu */}
      <div className="bg-tracao-cream-light border border-tracao-border-light rounded-2xl shadow-sm p-6 overflow-y-auto max-h-[70vh]">
        {error && (
          <div className="flex items-center gap-2 bg-tracao-error-light text-tracao-error text-sm p-3 rounded-xl mb-4">
            <AlertCircleIcon size={16} className="shrink-0" />
            {error}
          </div>
        )}

        {/* ── ÉTAPE 1 : Identité ── */}
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <SectionTitle icon={<UserIcon size={16} />} title="Secteur et Identité" />

            <Field label="Secteur d'activité">
              <button type="button" onClick={() => setIsDrawerOpen(true)}
                className={`${inputCls} flex justify-between items-center`}>
                <span className="flex items-center gap-2">
                  {secteur === "Agriculteur" && <UserIcon size={16} />}
                  {secteur === "Entreprise de Transformation" && <BuildingIcon size={16} />}
                  {secteur === "Institution" && <LandmarkIcon size={16} />}
                  {secteur === "Magasin/Boutique" && <StoreIcon size={16} />}
                  {secteur === "Acheteur Privé" && <BriefcaseIcon size={16} />}
                  {secteur}
                </span>
                <ChevronDownIcon size={18} className="text-tracao-choco-pale" />
              </button>
            </Field>

            {(secteur === "Agriculteur" || secteur === "Acheteur Privé") ? (
              <>
                {secteur === "Agriculteur" && (
                  <div className="flex flex-col gap-3 p-3 bg-tracao-cream-mid rounded-xl border border-tracao-border-light mb-2">
                    <p className="text-[10px] font-bold text-tracao-choco-pale uppercase">Type d'agriculteur</p>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="typeAgri" checked={typeAgriculteur === "Indépendant"} onChange={() => setTypeAgriculteur("Indépendant")} className="accent-tracao-cacao" />
                        <span className="text-xs font-bold text-tracao-choco">Indépendant</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="typeAgri" checked={typeAgriculteur === "Coopérative"} onChange={() => setTypeAgriculteur("Coopérative")} className="accent-tracao-cacao" />
                        <span className="text-xs font-bold text-tracao-choco">En Coopérative</span>
                      </label>
                    </div>
                    {typeAgriculteur === "Coopérative" && (
                      <Field label="Nom de la coopérative *">
                        <input type="text" value={coopName} onChange={(e) => setCoopName(e.target.value)}
                          className={inputCls} placeholder="Ex: Coop Bio-Togo" />
                      </Field>
                    )}
                  </div>
                )}

                <div className="flex gap-3">
                  <Field label="Prénom *" flex>
                    <input type="text" value={prenom} onChange={(e) => setPrenom(e.target.value)}
                      className={inputCls} placeholder="Jean" />
                  </Field>
                  <Field label="Nom *" flex>
                    <input type="text" value={nom} onChange={(e) => setNom(e.target.value)}
                      className={inputCls} placeholder="Dupont" />
                  </Field>
                </div>
                <Field label="Téléphone (International) *">
                  <input type="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)}
                    className={inputCls} placeholder="+228 90 00 00 00" />
                </Field>
                <Field label="Ville / Région">
                  <input type="text" value={region} onChange={(e) => setRegion(e.target.value)}
                    className={inputCls} placeholder="Kpalimé, Lomé..." />
                </Field>
              </>
            ) : (
              <>
                <Field label="Nom de l'organisation *">
                  <input type="text" value={orgName || storeName} 
                    onChange={(e) => secteur === "Magasin/Boutique" ? setStoreName(e.target.value) : setOrgName(e.target.value)}
                    className={inputCls} placeholder="Ex: Coop Bio-Togo" />
                </Field>
                
                <div className="flex gap-3">
                  <Field label="Contact (Nom) *" flex>
                    <input type="text" value={personToCall} onChange={(e) => setPersonToCall(e.target.value)}
                      className={inputCls} placeholder="M. Salami" />
                  </Field>
                  <Field label="Contact (Tél) *" flex>
                    <input type="tel" value={ptcNumber} onChange={(e) => setPtcNumber(e.target.value)}
                      className={inputCls} placeholder="+228..." />
                  </Field>
                </div>

                <Field label="Adresse physique">
                  <input type="text" value={address || storeAddress} 
                    onChange={(e) => secteur === "Magasin/Boutique" ? setStoreAddress(e.target.value) : setAddress(e.target.value)}
                    className={inputCls} placeholder="Rue des mines, Lomé" />
                </Field>

                {secteur === "Entreprise de Transformation" && (
                  <div className="flex gap-3">
                    <Field label="N° Registre" flex>
                      <input type="text" value={recordNumber} onChange={(e) => setRecordNumber(e.target.value)}
                        className={inputCls} placeholder="RCCM..." />
                    </Field>
                    <Field label="N° Taxe" flex>
                      <input type="text" value={taxNumber} onChange={(e) => setTaxNumber(e.target.value)}
                        className={inputCls} placeholder="IFU..." />
                    </Field>
                  </div>
                )}

                {secteur === "Institution" && (
                  <Field label="Site Web">
                    <input type="text" value={website} onChange={(e) => setWebsite(e.target.value)}
                      className={inputCls} placeholder="https://..." />
                  </Field>
                )}

                <Field label="Certification (PDF/IMG)">
                  <input type="file" onChange={(e) => setCertificationFile(e.target.files?.[0] || null)}
                    className="text-xs text-tracao-choco-pale mt-1" />
                </Field>
              </>
            )}

            <button onClick={() => { if (validateStep1()) goNext(); }}
              className={btnPrimary}>
              Suivant →
            </button>
          </div>
        )}

        {/* ── ÉTAPE 2 : Compte ── */}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            <SectionTitle icon={<MailIcon size={16} />} title="Identifiants de connexion" />

            <Field label="Adresse email *">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className={inputCls} placeholder="vous@email.com" />
            </Field>

            <Field label="Mot de passe *">
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputCls} pr-12`} placeholder="Minimum 6 caractères" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-tracao-choco-pale">
                  {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                </button>
              </div>
            </Field>

            <Field label="Confirmer le mot de passe *">
              <input type="password" value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputCls} placeholder="••••••••" />
            </Field>

            <div className="flex gap-3 mt-2">
              <button onClick={goBack} className={btnSecondary}><ArrowLeftIcon size={16} /> Retour</button>
              <button onClick={handleSignup} disabled={isLoading} className={`${btnPrimary} flex-[2]`}>
                {isLoading ? "Inscription..." : "Créer mon compte →"}
              </button>
            </div>
          </div>
        )}

        {/* ── ÉTAPE 3 : OTP ── */}
        {step === 3 && (
          <div className="flex flex-col gap-4 text-center">
            <div className="mx-auto bg-tracao-gold/20 p-4 rounded-full w-16 h-16 flex items-center justify-center text-tracao-gold mb-2">
              <KeyIcon size={32} />
            </div>
            <h2 className="text-lg font-extrabold text-tracao-choco">Vérifiez votre email</h2>
            <p className="text-xs text-tracao-choco-pale">
              Nous avons envoyé un code de 6 chiffres à <strong>{email}</strong>.
            </p>

            <input
              type="text"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              className="text-center text-2xl font-black tracking-[0.5em] w-full border-2 border-tracao-border rounded-xl p-4 focus:border-tracao-cacao outline-none"
              placeholder="000000"
            />

            <button onClick={handleVerifyOTP} disabled={isLoading || otpCode.length < 6}
              className={`${btnPrimary} w-full mt-4`}>
              {isLoading ? "Vérification..." : "Vérifier le code"}
            </button>
            
            <button className="text-xs text-tracao-cacao font-bold underline mt-2">
              Renvoyer le code
            </button>
          </div>
        )}

        {/* ── ÉTAPE 4 : Photo ── */}
        {step === 4 && (
          <div className="flex flex-col gap-4">
            <SectionTitle icon={<CameraIcon size={16} />} title="Photo de profil" />
            <div className="flex flex-col items-center gap-4 py-4">
              <div
                onClick={() => photoInputRef.current?.click()}
                className="relative w-32 h-32 rounded-full border-4 border-dashed border-tracao-border cursor-pointer overflow-hidden bg-tracao-cream-mid flex items-center justify-center"
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="Aperçu" className="w-full h-full object-cover" />
                ) : (
                  <CameraIcon size={32} className="text-tracao-choco-pale" />
                )}
              </div>
              <input ref={photoInputRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file, setPhotoFile, setPhotoPreview);
                }} />
              
              <button onClick={goNext} className={`${btnPrimary} w-full mt-4`}>
                {photoPreview ? "Continuer →" : "Passer cette étape →"}
              </button>
            </div>
          </div>
        )}

        {/* ── ÉTAPE 5 : KYC ── */}
        {step === 5 && (
          <div className="flex flex-col gap-4">
            <SectionTitle icon={<IdCardIcon size={16} />} title="Documents d'identité" />
            <p className="text-[10px] text-tracao-choco-pale uppercase font-bold tracking-widest">Requis pour la certification</p>

            <div className="grid grid-cols-2 gap-3">
              <KycZone label="Recto" preview={kycRectoPreview} onClick={() => kycRectoRef.current?.click()} />
              <KycZone label="Verso" preview={kycVersoPreview} onClick={() => kycVersoRef.current?.click()} />
            </div>
            <KycZone label="Selfie avec la pièce" preview={kycSelfiePreview} onClick={() => kycSelfieRef.current?.click()} />

            <input ref={kycRectoRef} type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0], setKycRectoFile, setKycRectoPreview)} />
            <input ref={kycVersoRef} type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0], setKycVersoFile, setKycVersoPreview)} />
            <input ref={kycSelfieRef} type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0], setKycSelfieFile, setKycSelfiePreview)} />

            <label className="flex items-start gap-3 mt-2 cursor-pointer">
              <input type="checkbox" checked={kycConfirmed} onChange={(e) => setKycConfirmed(e.target.checked)} className="mt-1 accent-tracao-cacao" />
              <span className="text-[10px] text-tracao-choco-pale leading-tight font-medium">
                Je certifie que ces documents sont authentiques et m'appartiennent.
              </span>
            </label>

            <button onClick={handleSubmitKYC} disabled={isLoading || !kycConfirmed} className={`${btnPrimary} w-full mt-4`}>
              {isLoading ? "Envoi en cours..." : "Finaliser l'inscription"}
            </button>
          </div>
        )}

        {/* Lien connexion */}
        {step < 3 && (
          <p className="text-sm text-center text-tracao-choco-light mt-6">
            Déjà un compte ?{" "}
            <Link href="/login" className="text-tracao-cacao font-bold hover:underline">Se connecter</Link>
          </p>
        )}
      </div>

      {/* Drawer Sélection Secteur */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsDrawerOpen(false)} />
          <div className="relative bg-white rounded-t-3xl p-6 flex flex-col gap-3 animate-in slide-in-from-bottom duration-300">
            <h3 className="font-bold text-tracao-choco mb-2">Choisissez votre secteur</h3>
            {secteurs.map((s) => (
              <button key={s} onClick={() => { setSecteur(s); setIsDrawerOpen(false); }}
                className={`p-4 rounded-xl text-left font-bold text-sm ${secteur === s ? "bg-tracao-cacao text-white" : "bg-tracao-cream-mid text-tracao-choco"}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <span className="text-tracao-cacao">{icon}</span>
      <h2 className="text-base font-extrabold text-tracao-choco">{title}</h2>
    </div>
  );
}

function Field({ label, children, flex }: { label: string; children: React.ReactNode; flex?: boolean }) {
  return (
    <div className={flex ? "flex-1" : "w-full"}>
      <label className="block text-[10px] font-bold text-tracao-choco-pale uppercase tracking-widest mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function KycZone({ label, preview, onClick }: { label: string; preview: string | null; onClick: () => void }) {
  return (
    <div onClick={onClick} className="aspect-video bg-tracao-cream-mid rounded-xl border-2 border-dashed border-tracao-border flex flex-col items-center justify-center gap-2 overflow-hidden cursor-pointer">
      {preview ? (
        <img src={preview} alt={label} className="w-full h-full object-cover" />
      ) : (
        <>
          <UploadCloudIcon size={20} className="text-tracao-choco-pale" />
          <span className="text-[9px] font-bold text-tracao-choco-pale uppercase">{label}</span>
        </>
      )}
    </div>
  );
}

const inputCls = "w-full border border-tracao-border rounded-xl p-3 bg-white text-sm text-tracao-choco focus:outline-none focus:border-tracao-cacao focus:ring-1 focus:ring-tracao-cacao transition-all";
const btnPrimary = "py-3.5 bg-tracao-cacao text-white rounded-xl font-bold hover:bg-tracao-choco-mid transition-colors text-sm disabled:opacity-50";
const btnSecondary = "flex items-center gap-1.5 px-4 py-3.5 bg-tracao-cream-mid text-tracao-choco rounded-xl font-bold hover:bg-tracao-border transition-colors text-sm";
