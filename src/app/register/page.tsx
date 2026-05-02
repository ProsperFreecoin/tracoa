"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { useAgriculteur } from "../../context/AgriculteurContext";
import { uploadImage, validateImageFile } from "../../lib/cloudinary";
import {
  ChevronDownIcon, XIcon, UserIcon, MailIcon, LockIcon,
  CameraIcon, IdCardIcon, CheckCircle2Icon, AlertCircleIcon,
  ArrowLeftIcon, UploadCloudIcon, EyeIcon, EyeOffIcon
} from "lucide-react";

const TOTAL_STEPS = 4;

const STEP_LABELS = [
  "Identité",
  "Compte",
  "Photo",
  "Vérification",
];

const secteurs = ["Agriculteur", "Client", "Coopérative", "Transporteur"];

export default function RegisterScreen() {
  const router = useRouter();
  const { connecter } = useAgriculteur();

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Étape 1 — Identité
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [region, setRegion] = useState("");
  const [secteur, setSecteur] = useState("Agriculteur");

  // Étape 2 — Compte
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Étape 3 — Photo de profil
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Étape 4 — KYC
  const [kycRectoFile, setKycRectoFile] = useState<File | null>(null);
  const [kycRectoPreview, setKycRectoPreview] = useState<string | null>(null);
  const [kycVersoFile, setKycVersoFile] = useState<File | null>(null);
  const [kycVersoPreview, setKycVersoPreview] = useState<string | null>(null);
  const [kycConfirmed, setKycConfirmed] = useState(false);
  const kycRectoRef = useRef<HTMLInputElement>(null);
  const kycVersoRef = useRef<HTMLInputElement>(null);

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
    if (!prenom.trim() || !nom.trim()) { setError("Prénom et nom obligatoires."); return false; }
    
    // Validation téléphone (Standard international E.164)
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    const cleanPhone = telephone.replace(/\s/g, '');
    if (telephone && !phoneRegex.test(cleanPhone)) {
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

  /* ── Soumission finale (étape 4) ── */
  const handleSubmit = async () => {
    if (!kycRectoFile) { setError("Veuillez ajouter la photo recto de votre pièce d'identité."); return; }
    if (!kycConfirmed) { setError("Veuillez confirmer que vos informations sont exactes."); return; }
    setIsLoading(true);
    setError("");

    try {
      // 1. Créer le compte Firebase
      const { user } = await createUserWithEmailAndPassword(auth, email, password);

      // 2. Upload photo de profil
      let photoUrl: string | undefined;
      if (photoFile) {
        const res = await uploadImage(photoFile, "tracao/profils", setUploadProgress);
        photoUrl = res.secure_url;
      }

      // 3. Upload KYC recto
      setUploadProgress(0);
      const kycRes = await uploadImage(kycRectoFile, "tracao/kyc", setUploadProgress);
      const kycDocumentUrl = kycRes.secure_url;

      // 4. Upload KYC verso (optionnel)
      let kycDocumentVersoUrl: string | undefined;
      if (kycVersoFile) {
        setUploadProgress(0);
        const versoRes = await uploadImage(kycVersoFile, "tracao/kyc", setUploadProgress);
        kycDocumentVersoUrl = versoRes.secure_url;
      }

      // 5. Créer le profil Firestore
      await connecter({
        id: user.uid,
        nom: nom.trim(),
        prenom: prenom.trim(),
        email,
        telephone: telephone || undefined,
        region: region || undefined,
        secteur,
        certifie: false,
        photoUrl,
        kycStatut: "en_attente",
        kycDocumentUrl,
        kycDocumentVersoUrl,
        kycSoumisLe: new Date().toISOString(),
      });

    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") setError("Cet email est déjà utilisé.");
      else setError(err.message || "Erreur lors de l'inscription.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-tracao-cream p-5 justify-center">
      {/* Header */}
      <div className="text-center mb-6">
        <img src="/icon-192.png" alt="Tracao Logo" className="w-12 h-12 mx-auto object-contain" />
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
      <div className="flex justify-between mb-6 px-1">
        {STEP_LABELS.map((label, i) => (
          <span key={i} className={`text-[10px] font-bold uppercase tracking-wide ${i + 1 === step ? "text-tracao-cacao" : i + 1 < step ? "text-tracao-choco-light" : "text-tracao-border"}`}>
            {label}
          </span>
        ))}
      </div>

      {/* Carte de contenu */}
      <div className="bg-tracao-cream-light border border-tracao-border-light rounded-2xl shadow-sm p-6">
        {error && (
          <div className="flex items-center gap-2 bg-tracao-error-light text-tracao-error text-sm p-3 rounded-xl mb-4">
            <AlertCircleIcon size={16} className="shrink-0" />
            {error}
          </div>
        )}

        {/* ── ÉTAPE 1 : Identité ── */}
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <SectionTitle icon={<UserIcon size={16} />} title="Informations personnelles" />

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

            <Field label="Téléphone">
              <input type="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)}
                className={inputCls} placeholder="+228 90 00 00 00" />
              <p className="text-[9px] text-tracao-choco-pale mt-1 font-medium">Format international requis (ex: +228...)</p>
            </Field>

            <Field label="Région">
              <input type="text" value={region} onChange={(e) => setRegion(e.target.value)}
                className={inputCls} placeholder="Ex : Kpalimé, Lomé..." />
            </Field>

            <Field label="Secteur d'activité">
              <button type="button" onClick={() => setIsDrawerOpen(true)}
                className={`${inputCls} flex justify-between items-center`}>
                <span>{secteur}</span>
                <ChevronDownIcon size={18} className="text-tracao-choco-pale" />
              </button>
            </Field>

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
              <button onClick={() => { if (validateStep2()) goNext(); }} className={`${btnPrimary} flex-[2]`}>
                Suivant →
              </button>
            </div>
          </div>
        )}

        {/* ── ÉTAPE 3 : Photo de profil ── */}
        {step === 3 && (
          <div className="flex flex-col gap-4">
            <SectionTitle icon={<CameraIcon size={16} />} title="Photo de profil" />
            <p className="text-xs text-tracao-choco-pale">
              Ajoutez une photo claire de vous. Elle sera visible sur votre profil et par vos coopératives.
            </p>

            {/* Zone de preview / upload */}
            <div className="flex flex-col items-center gap-4">
              <div
                onClick={() => photoInputRef.current?.click()}
                className="relative w-32 h-32 rounded-full border-4 border-dashed border-tracao-border cursor-pointer hover:border-tracao-cacao transition-colors overflow-hidden bg-tracao-cream-mid flex items-center justify-center"
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="Aperçu" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-tracao-choco-pale">
                    <CameraIcon size={32} />
                    <span className="text-[10px] font-semibold">Ajouter</span>
                  </div>
                )}
              </div>
              <input ref={photoInputRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file, setPhotoFile, setPhotoPreview);
                }} />

              {photoPreview && (
                <button onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                  className="text-xs text-tracao-error font-semibold flex items-center gap-1">
                  <XIcon size={12} /> Supprimer
                </button>
              )}

              <button onClick={() => photoInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 border-2 border-tracao-cacao text-tracao-cacao rounded-xl font-bold text-sm hover:bg-tracao-cream-mid transition-colors">
                <UploadCloudIcon size={16} />
                {photoPreview ? "Changer la photo" : "Choisir une photo"}
              </button>
            </div>

            <div className="flex gap-3 mt-2">
              <button onClick={goBack} className={btnSecondary}><ArrowLeftIcon size={16} /> Retour</button>
              <button onClick={goNext} className={`${btnPrimary} flex-[2]`}>
                {photoPreview ? "Continuer →" : "Passer cette étape →"}
              </button>
            </div>
          </div>
        )}

        {/* ── ÉTAPE 4 : KYC ── */}
        {step === 4 && (
          <div className="flex flex-col gap-4">
            <SectionTitle icon={<IdCardIcon size={16} />} title="Vérification d'identité (KYC)" />
            <p className="text-xs text-tracao-choco-pale leading-relaxed">
              Pour garantir la fiabilité de votre compte, fournissez une photo lisible de votre pièce d'identité. Vos données seront comparées avec les informations que vous avez saisies.
            </p>

            {/* Récapitulatif des infos saisies */}
            <div className="bg-tracao-cream-mid rounded-xl p-3 border border-tracao-border-light">
              <p className="text-[10px] font-bold text-tracao-choco-pale uppercase tracking-wide mb-2">Informations à vérifier</p>
              <div className="flex flex-col gap-1">
                <InfoLine label="Nom" value={`${prenom} ${nom}`} />
                {telephone && <InfoLine label="Téléphone" value={telephone} />}
                {region && <InfoLine label="Région" value={region} />}
              </div>
            </div>

            {/* Upload recto */}
            <div>
              <label className={labelCls}>Recto de la pièce d'identité *</label>
              <KycUploadZone
                preview={kycRectoPreview}
                label="Carte d'identité / Passeport — Recto"
                onClick={() => kycRectoRef.current?.click()}
                onRemove={() => { setKycRectoFile(null); setKycRectoPreview(null); }}
              />
              <input ref={kycRectoRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file, setKycRectoFile, setKycRectoPreview);
                }} />
            </div>

            {/* Upload verso */}
            <div>
              <label className={labelCls}>Verso (optionnel)</label>
              <KycUploadZone
                preview={kycVersoPreview}
                label="Verso de la pièce d'identité"
                onClick={() => kycVersoRef.current?.click()}
                onRemove={() => { setKycVersoFile(null); setKycVersoPreview(null); }}
              />
              <input ref={kycVersoRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file, setKycVersoFile, setKycVersoPreview);
                }} />
            </div>

            {/* Confirmation concordance */}
            <label className="flex items-start gap-3 cursor-pointer bg-tracao-cream-mid p-3 rounded-xl border border-tracao-border-light">
              <input type="checkbox" checked={kycConfirmed} onChange={(e) => setKycConfirmed(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-tracao-cacao" />
              <span className="text-xs text-tracao-choco leading-relaxed">
                Je confirme que les informations saisies correspondent exactement à celles sur ma pièce d'identité.
              </span>
            </label>

            {/* Barre de progression upload */}
            {isLoading && uploadProgress > 0 && (
              <div className="bg-tracao-cream-mid rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-tracao-cacao rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}

            <div className="flex gap-3 mt-2">
              <button onClick={goBack} disabled={isLoading} className={btnSecondary}>
                <ArrowLeftIcon size={16} /> Retour
              </button>
              <button onClick={handleSubmit} disabled={isLoading}
                className={`${btnPrimary} flex-[2] disabled:opacity-60`}>
                {isLoading ? (
                  <span className="flex items-center gap-2 justify-center">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Inscription...
                  </span>
                ) : (
                  <span className="flex items-center gap-2 justify-center">
                    <CheckCircle2Icon size={16} /> Finaliser l'inscription
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Lien connexion */}
        <p className="text-sm text-center text-tracao-choco-light mt-6">
          Déjà un compte ?{" "}
          <Link href="/login" className="text-tracao-cacao font-bold hover:underline">Se connecter</Link>
        </p>
      </div>

      {/* Tiroir sélection secteur */}
      <div className={`fixed inset-0 z-50 flex flex-col justify-end transition-opacity duration-300 ${isDrawerOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        <div className="absolute inset-0 bg-black/40" onClick={() => setIsDrawerOpen(false)} />
        <div className={`relative bg-tracao-cream w-full max-w-md mx-auto rounded-t-3xl p-6 shadow-2xl transition-transform duration-300 ${isDrawerOpen ? "translate-y-0" : "translate-y-full"}`}>
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-lg font-extrabold text-tracao-choco">Choisissez un secteur</h3>
            <button onClick={() => setIsDrawerOpen(false)} className="p-2 bg-tracao-cream-mid rounded-full">
              <XIcon size={20} />
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {secteurs.map((s) => (
              <button key={s} onClick={() => { setSecteur(s); setIsDrawerOpen(false); }}
                className={`p-4 rounded-xl text-left font-bold transition-all ${secteur === s ? "bg-tracao-cacao text-white" : "bg-white text-tracao-choco border border-tracao-border-light hover:bg-tracao-cream-mid"}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Sous-composants ── */

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
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-[11px] text-tracao-choco-pale">{label}</span>
      <span className="text-[11px] font-bold text-tracao-choco">{value}</span>
    </div>
  );
}

function KycUploadZone({ preview, label, onClick, onRemove }: {
  preview: string | null; label: string; onClick: () => void; onRemove: () => void;
}) {
  return (
    <div
      onClick={!preview ? onClick : undefined}
      className={`relative mt-1.5 rounded-xl border-2 border-dashed overflow-hidden cursor-pointer transition-colors ${preview ? "border-tracao-forest" : "border-tracao-border hover:border-tracao-cacao"}`}
    >
      {preview ? (
        <div className="relative">
          <img src={preview} alt="Document" className="w-full h-36 object-cover" />
          <div className="absolute inset-0 bg-black/30 flex items-end justify-between p-2">
            <span className="text-[10px] text-white font-bold bg-tracao-forest/80 px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2Icon size={10} /> Ajouté
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="text-[10px] text-white font-bold bg-tracao-error/80 px-2 py-0.5 rounded-full flex items-center gap-1">
              <XIcon size={10} /> Retirer
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 py-6 text-tracao-choco-pale">
          <UploadCloudIcon size={28} />
          <span className="text-xs font-semibold text-center px-4">{label}</span>
          <span className="text-[10px]">JPG, PNG, WEBP — Max 15 Mo</span>
        </div>
      )}
    </div>
  );
}

const inputCls = "w-full border border-tracao-border rounded-xl p-3 bg-white text-sm text-tracao-choco focus:outline-none focus:border-tracao-cacao focus:ring-1 focus:ring-tracao-cacao transition-all";
const labelCls = "block text-[10px] font-bold text-tracao-choco-pale uppercase tracking-widest mb-1.5";
const btnPrimary = "flex-1 py-3.5 bg-tracao-cacao text-white rounded-xl font-bold hover:bg-tracao-choco-mid transition-colors text-sm";
const btnSecondary = "flex items-center gap-1.5 px-4 py-3.5 bg-tracao-cream-mid text-tracao-choco rounded-xl font-bold hover:bg-tracao-border transition-colors text-sm";
