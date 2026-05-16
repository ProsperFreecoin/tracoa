"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAgriculteur } from "../../context/AgriculteurContext";
import { useLots } from "../../context/LotsContext";
import { uploadImage, validateImageFile } from "../../lib/cloudinary";
import {
  UserIcon, MailIcon, PhoneIcon, MapPinIcon, BuildingIcon,
  ShieldCheckIcon, LogOutIcon, ChevronRightIcon, LinkIcon, EditIcon,
  CheckCircle2Icon, XCircleIcon, BellIcon, HelpCircleIcon, InfoIcon,
  CameraIcon, ClockIcon, XIcon, AlertTriangleIcon
} from "lucide-react";
import { KycModal } from "../../components/KycModal";
import { KycStatut } from "../../types";

const KYC_CONFIG: Record<KycStatut, { label: string; color: string; icon: React.ReactNode }> = {
  non_soumis: { label: "KYC non soumis", color: "bg-tracao-border text-tracao-choco-pale", icon: <AlertTriangleIcon size={11} /> },
  en_attente: { label: "KYC en attente", color: "bg-amber-100 text-amber-700", icon: <ClockIcon size={11} /> },
  verifie: { label: "KYC Validé", color: "bg-tracao-forest-light text-tracao-forest", icon: <CheckCircle2Icon size={11} /> },
  rejete: { label: "KYC Non Validé", color: "bg-tracao-error-light text-tracao-error", icon: <XCircleIcon size={11} /> },
};

export default function ProfilScreen() {
  const router = useRouter();
  const { agriculteur, deconnecter, mettreAJourProfil } = useAgriculteur();
  const { totalLots, totalPoidsKg, lotsSyncronises } = useLots();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [tempEmail, setTempEmail] = useState("");
  const [tempTelephone, setTempTelephone] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showKycModal, setShowKycModal] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  if (!agriculteur) return null;

  const kycStatut: KycStatut = agriculteur.kycStatut ?? "non_soumis";
  const kycConfig = KYC_CONFIG[kycStatut];
  const initials = `${agriculteur.prenom.charAt(0)}${agriculteur.nom.charAt(0)}`.toUpperCase();

  const handlePhotoChange = async (file: File) => {
    const err = validateImageFile(file, 10);
    if (err) return;
    setIsUploadingPhoto(true);
    try {
      const res = await uploadImage(file, "tracao/profils");
      await mettreAJourProfil({ photoUrl: res.secure_url });
    } catch (e) {
      console.error("Erreur upload photo:", e);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const stats = [
    { label: "Lots enregistrés", value: totalLots, icon: "📦" },
    { label: "Kg total", value: `${totalPoidsKg.toFixed(0)} kg`, icon: "⚖️" },
    { label: "Sur blockchain", value: lotsSyncronises, icon: "🔗" },
  ];

  const infoRows = [
    { icon: UserIcon, label: "Nom complet", value: `${agriculteur.prenom} ${agriculteur.nom}`, editable: false },
    { icon: MailIcon, label: "Email", value: agriculteur.email || "Non renseigné", editable: true },
    { icon: PhoneIcon, label: "Téléphone", value: agriculteur.telephone || "Non renseigné", editable: true },
    { icon: MapPinIcon, label: "Région", value: agriculteur.region || "Non renseignée", editable: false },
    { icon: BuildingIcon, label: "Coopérative", value: agriculteur.cooperative || "Indépendant", editable: false },
    { icon: ShieldCheckIcon, label: "Secteur", value: agriculteur.secteur || "Agriculteur", editable: false },
  ];

  return (
    <div className="flex flex-col flex-1 bg-tracao-cream lg:bg-zinc-100 min-h-screen pb-24 lg:pb-8">

      {/* Header */}
      <div className="bg-tracao-cacao lg:rounded-2xl lg:m-6 lg:mb-0 p-6 pt-10 lg:pt-8 text-white shadow-md">
        <div className="flex items-center gap-4 mb-6">
          {/* Avatar avec photo ou initiales */}
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-tracao-gold flex items-center justify-center shadow-lg">
              {agriculteur.photoUrl ? (
                <img src={agriculteur.photoUrl} alt="Photo de profil" className="w-full h-full object-cover" />
              ) : (
                <span className="text-tracao-choco font-black text-2xl">{initials}</span>
              )}
            </div>
            {/* Bouton modifier photo */}
            <button
              onClick={() => photoInputRef.current?.click()}
              disabled={isUploadingPhoto}
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-tracao-gold rounded-full flex items-center justify-center shadow-md hover:bg-tracao-gold-dark transition-colors"
            >
              {isUploadingPhoto ? (
                <span className="w-3 h-3 border border-tracao-choco/50 border-t-tracao-choco rounded-full animate-spin" />
              ) : (
                <CameraIcon size={12} className="text-tracao-choco" />
              )}
            </button>
            <input ref={photoInputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoChange(f); }} />
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black truncate">{agriculteur.prenom} {agriculteur.nom}</h1>
            <p className="text-sm text-white/60 truncate">{agriculteur.email || "Pas d'email"}</p>
            {/* Badges */}
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {agriculteur.certifie ? (
                <span className="flex items-center gap-1 text-[11px] bg-tracao-forest-light text-tracao-forest font-bold px-2 py-0.5 rounded-full">
                  <CheckCircle2Icon size={11} /> Certifié
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] bg-white/10 text-white/60 font-semibold px-2 py-0.5 rounded-full">
                  <XCircleIcon size={11} /> Non certifié
                </span>
              )}
              {/* Badge KYC */}
              <span className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${kycConfig.color}`}>
                {kycConfig.icon} {kycConfig.label}
              </span>
              {/* Badge Sync Django */}
              {agriculteur.djangoId && (
                <span className="flex items-center gap-1 text-[11px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">
                  <LinkIcon size={11} /> Sync Backend ✓
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {stats.map((s) => (
            <div key={s.label} className="bg-white/15 rounded-xl p-3 text-center">
              <div className="text-lg mb-0.5">{s.icon}</div>
              <p className="text-lg font-black">{s.value}</p>
              <p className="text-[9px] text-white/60 uppercase font-semibold leading-tight mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="p-5 lg:p-6 mt-2 flex flex-col gap-4">

        {/* Alerte KYC si non soumis ou rejeté */}
        {(kycStatut === "non_soumis" || kycStatut === "rejete") && (
          <button 
            onClick={() => setShowKycModal(true)}
            className={`flex items-start text-left w-full gap-3 p-4 rounded-2xl border transition-all active:scale-[0.98] ${kycStatut === "rejete" ? "bg-tracao-error-light border-tracao-error/20 hover:bg-tracao-error/10" : "bg-amber-50 border-amber-200 hover:bg-amber-100"}`}>
            <AlertTriangleIcon size={18} className={kycStatut === "rejete" ? "text-tracao-error shrink-0 mt-0.5" : "text-amber-600 shrink-0 mt-0.5"} />
            <div className="flex-1">
              <p className={`text-xs font-bold ${kycStatut === "rejete" ? "text-tracao-error" : "text-amber-700"}`}>
                {kycStatut === "rejete" ? "KYC Non Validé" : "Identité non vérifiée"}
              </p>
              <p className={`text-[11px] mt-0.5 ${kycStatut === "rejete" ? "text-tracao-error/80" : "text-amber-600"}`}>
                {kycStatut === "rejete"
                  ? "Vos documents ont été rejetés. Veuillez soumettre de nouveaux documents."
                  : "Complétez la vérification KYC pour accéder à toutes les fonctionnalités."}
              </p>
            </div>
            <ChevronRightIcon size={16} className={kycStatut === "rejete" ? "text-tracao-error/40 mt-1.5" : "text-amber-400 mt-1.5"} />
          </button>
        )}

        {/* Informations personnelles */}
        <section>
          <h2 className="text-xs font-bold text-tracao-choco-pale uppercase tracking-widest mb-2 px-1">Informations personnelles</h2>
          <div className="bg-tracao-cream-light border border-tracao-border-light rounded-2xl overflow-hidden divide-y divide-tracao-border-light">
            {infoRows.map(({ icon: Icon, label, value, editable }) => (
              <div
                key={label}
                className={`flex items-center gap-3 px-4 py-3.5 transition-colors ${editable ? "cursor-pointer hover:bg-tracao-cream-mid/50" : ""}`}
                onClick={() => { if (editable) { setTempEmail(agriculteur.email || ""); setTempTelephone(agriculteur.telephone || ""); setShowEditModal(true); } }}
              >
                <div className="w-8 h-8 rounded-lg bg-tracao-cream-mid flex items-center justify-center shrink-0">
                  <Icon size={15} className="text-tracao-cacao" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-tracao-choco-pale uppercase font-semibold">{label}</p>
                  <p className={`text-sm font-semibold truncate ${value === "Non renseigné" || value === "Non renseignée" ? "text-tracao-choco-pale italic" : "text-tracao-choco"}`}>
                    {value}
                  </p>
                </div>
                {editable && <div className="p-1.5 bg-tracao-cream-mid rounded-lg text-tracao-choco-pale"><EditIcon size={12} /></div>}
              </div>
            ))}
          </div>
        </section>

        {/* Documents KYC */}
        {agriculteur.kycDocumentUrl && (
          <section>
            <h2 className="text-xs font-bold text-tracao-choco-pale uppercase tracking-widest mb-2 px-1">Documents KYC</h2>
            <div className="bg-tracao-cream-light border border-tracao-border-light rounded-2xl overflow-hidden">
              <div className="flex gap-3 p-4">
                <div className="flex-1">
                  <p className="text-[10px] text-tracao-choco-pale uppercase font-semibold mb-1.5">Pièce d'identité (Recto)</p>
                  <img src={agriculteur.kycDocumentUrl} alt="KYC Recto" className="w-full h-24 object-cover rounded-lg border border-tracao-border-light" />
                </div>
                {agriculteur.kycDocumentVersoUrl && (
                  <div className="flex-1">
                    <p className="text-[10px] text-tracao-choco-pale uppercase font-semibold mb-1.5">Verso</p>
                    <img src={agriculteur.kycDocumentVersoUrl} alt="KYC Verso" className="w-full h-24 object-cover rounded-lg border border-tracao-border-light" />
                  </div>
                )}
              </div>
              {agriculteur.kycSoumisLe && (
                <div className="px-4 pb-3">
                  <p className="text-[10px] text-tracao-choco-pale">
                    Soumis le : {new Date(agriculteur.kycSoumisLe).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Paramètres */}
        <section>
          <h2 className="text-xs font-bold text-tracao-choco-pale uppercase tracking-widest mb-2 px-1">Paramètres</h2>
          <div className="bg-tracao-cream-light border border-tracao-border-light rounded-2xl overflow-hidden divide-y divide-tracao-border-light">
            {[
              { icon: BellIcon, label: "Notifications", sub: "Gérer les alertes", action: () => setShowNotificationsModal(true) },
              { icon: HelpCircleIcon, label: "Aide & Support", sub: "FAQ, contact", action: () => router.push("/aide") },
              { icon: InfoIcon, label: "À propos de Tracao", sub: "Version 1.0.0", action: () => setShowAboutModal(true) },
            ].map(({ icon: Icon, label, sub, action }) => (
              <button key={label} onClick={action}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-tracao-cream transition-colors">
                <div className="w-8 h-8 rounded-lg bg-tracao-cream-mid flex items-center justify-center shrink-0">
                  <Icon size={15} className="text-tracao-choco-light" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-tracao-choco">{label}</p>
                  <p className="text-[11px] text-tracao-choco-pale">{sub}</p>
                </div>
                <ChevronRightIcon size={16} className="text-tracao-choco-pale" />
              </button>
            ))}
          </div>
        </section>

        {/* Déconnexion */}
        <button onClick={() => setShowLogoutConfirm(true)}
          className="w-full flex items-center justify-center gap-2 bg-tracao-error-light border border-tracao-error/20 text-tracao-error font-bold py-4 rounded-2xl hover:bg-tracao-error/15 transition-colors">
          <LogOutIcon size={18} /> Se déconnecter
        </button>

        <p className="text-center text-[11px] text-tracao-choco-pale pb-2">Tracao · Traçabilité Cacao-Café · v1.0.0</p>
      </div>

      {/* Modal déconnexion */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end lg:items-center justify-center animate-in fade-in duration-200">
          <div className="bg-tracao-cream-light w-full max-w-md rounded-t-3xl lg:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
            <div className="w-12 h-12 bg-tracao-error-light rounded-2xl flex items-center justify-center mx-auto mb-4">
              <LogOutIcon size={22} className="text-tracao-error" />
            </div>
            <h3 className="text-lg font-extrabold text-tracao-choco text-center mb-1">Se déconnecter ?</h3>
            <p className="text-sm text-tracao-choco-light text-center mb-6">Vous serez redirigé vers la page de connexion.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3.5 bg-tracao-cream-mid text-tracao-choco rounded-xl font-bold hover:bg-tracao-border transition-colors">Annuler</button>
              <button onClick={() => deconnecter()}
                className="flex-[1.5] py-3.5 bg-tracao-error text-white rounded-xl font-bold hover:bg-tracao-error/90 transition-colors">Déconnexion</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal édition contacts */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end lg:items-center justify-center animate-in fade-in duration-200">
          <div className="bg-tracao-cream-light w-full max-w-md rounded-t-3xl lg:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-tracao-choco">Modifier mes contacts</h3>
              <button onClick={() => setShowEditModal(false)} className="p-2 bg-tracao-cream-mid rounded-full text-tracao-choco-pale hover:text-tracao-choco">
                <XIcon size={20} />
              </button>
            </div>
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-[10px] font-bold text-tracao-choco-pale uppercase tracking-widest mb-1.5 ml-1">Email</label>
                <div className="relative">
                  <MailIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-tracao-choco-pale" />
                  <input type="email" value={tempEmail} onChange={(e) => setTempEmail(e.target.value)}
                    className="w-full bg-white border border-tracao-border rounded-xl py-3.5 pl-11 pr-4 text-sm font-semibold text-tracao-choco focus:outline-none focus:border-tracao-cacao focus:ring-1 focus:ring-tracao-cacao"
                    placeholder="votre@email.com" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-tracao-choco-pale uppercase tracking-widest mb-1.5 ml-1">Téléphone</label>
                <div className="relative">
                  <PhoneIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-tracao-choco-pale" />
                  <input type="tel" value={tempTelephone} onChange={(e) => setTempTelephone(e.target.value)}
                    className="w-full bg-white border border-tracao-border rounded-xl py-3.5 pl-11 pr-4 text-sm font-semibold text-tracao-choco focus:outline-none focus:border-tracao-cacao focus:ring-1 focus:ring-tracao-cacao"
                    placeholder="+228 00 00 00 00" />
                </div>
              </div>
              <div className="bg-tracao-cream-mid p-3.5 rounded-xl border border-tracao-border-light">
                <p className="text-[11px] text-tracao-choco-pale leading-relaxed flex gap-2">
                  <InfoIcon size={14} className="shrink-0 mt-0.5" />
                  <span>Les informations d'identité (Nom, Prénom, ID) ne peuvent être modifiées que par un administrateur.</span>
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowEditModal(false)} disabled={isSaving}
                className="flex-1 py-3.5 bg-tracao-cream-mid text-tracao-choco rounded-xl font-bold hover:bg-tracao-border transition-colors">Annuler</button>
              <button disabled={isSaving}
                onClick={async () => {
                  setIsSaving(true);
                  await mettreAJourProfil({ email: tempEmail, telephone: tempTelephone });
                  setIsSaving(false);
                  setShowEditModal(false);
                }}
                className="flex-[1.5] py-3.5 bg-tracao-cacao text-white rounded-xl font-bold hover:bg-tracao-cacao/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                {isSaving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Notifications */}
      {showNotificationsModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-tracao-cream-light w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-black text-tracao-choco">Notifications</h3>
              <button onClick={() => setShowNotificationsModal(false)} className="p-2 bg-tracao-cream-mid rounded-full text-tracao-choco-pale hover:text-tracao-choco">
                <XIcon size={20} />
              </button>
            </div>
            <div className="py-4 flex flex-col gap-3">
              <div className="bg-white p-3.5 rounded-xl border border-tracao-border-light flex gap-3 items-start shadow-sm">
                <div className="p-2 bg-tracao-forest-light text-tracao-forest rounded-lg shrink-0">
                  <CheckCircle2Icon size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-tracao-choco">KYC Validé</p>
                  <p className="text-[11px] text-tracao-choco-light mt-0.5 leading-relaxed">Vos documents KYC ont été approuvés avec succès. Vous avez désormais accès à toutes les fonctionnalités.</p>
                  <p className="text-[10px] text-tracao-choco-pale mt-1.5 font-bold uppercase tracking-wider">Il y a 2 heures</p>
                </div>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-tracao-border-light flex gap-3 items-start shadow-sm">
                <div className="p-2 bg-tracao-cream-mid text-tracao-cacao rounded-lg shrink-0">
                  <BuildingIcon size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-tracao-choco">Nouvelle Coopérative</p>
                  <p className="text-[11px] text-tracao-choco-light mt-0.5 leading-relaxed">La coopérative SCOOPS-CA vous a ajouté à sa liste de producteurs affiliés.</p>
                  <p className="text-[10px] text-tracao-choco-pale mt-1.5 font-bold uppercase tracking-wider">Hier, 14:30</p>
                </div>
              </div>
            </div>
            <button onClick={() => setShowNotificationsModal(false)} className="w-full py-3.5 mt-4 bg-tracao-cream-mid text-tracao-choco rounded-xl font-bold hover:bg-tracao-border transition-colors">Fermer</button>
          </div>
        </div>
      )}

      {/* Modal À propos */}
      {showAboutModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-tracao-cream-light w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-black text-tracao-choco">À propos de Tracao</h3>
              <button onClick={() => setShowAboutModal(false)} className="p-2 bg-tracao-cream-mid rounded-full text-tracao-choco-pale hover:text-tracao-choco">
                <XIcon size={20} />
              </button>
            </div>
            <div className="py-4 flex flex-col items-center text-center">
              <img src="/icon-192.png" alt="Tracao Logo" className="w-16 h-16 mb-4 object-contain drop-shadow-md" />
              <h4 className="text-xl font-black text-tracao-choco mb-1">Tracao</h4>
              <p className="text-[10px] text-tracao-cacao uppercase font-bold tracking-widest mb-4">Traçabilité & Transparence</p>
              <p className="text-xs text-tracao-choco-light mb-6 px-2 leading-relaxed font-medium">
                Solution blockchain sécurisée garantissant la conformité EUDR et la juste rémunération des producteurs de café et de cacao.
              </p>
              <div className="w-full bg-tracao-cream-mid p-4 rounded-xl border border-tracao-border-light text-left text-xs text-tracao-choco-light space-y-2">
                <div className="flex justify-between items-center border-b border-tracao-border-light pb-2">
                  <span className="font-semibold uppercase text-[10px] tracking-wider">Version</span>
                  <span className="text-tracao-choco font-mono font-bold">1.0.0 (Build 42)</span>
                </div>
                <div className="flex justify-between items-center border-b border-tracao-border-light py-2">
                  <span className="font-semibold uppercase text-[10px] tracking-wider">Réseau</span>
                  <span className="text-tracao-forest font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-tracao-forest animate-pulse" /> Polygon Mainnet</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="font-semibold uppercase text-[10px] tracking-wider">Support</span>
                  <a href="mailto:support@tracao.io" className="text-tracao-cacao font-bold hover:underline">support@tracao.io</a>
                </div>
              </div>
              <p className="text-[10px] text-tracao-choco-pale mt-6 font-semibold uppercase tracking-wide">© 2026 Tracao Technologies<br/>Tous droits réservés.</p>
            </div>
            <button onClick={() => setShowAboutModal(false)} className="w-full py-3.5 mt-2 bg-tracao-cacao text-white rounded-xl font-bold hover:bg-tracao-choco-mid transition-colors">Fermer</button>
          </div>
        </div>
      )}
      {/* Modal KYC */}
      {showKycModal && (
        <KycModal onClose={() => setShowKycModal(false)} />
      )}
    </div>
  );
}
