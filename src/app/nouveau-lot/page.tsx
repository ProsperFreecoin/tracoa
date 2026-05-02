"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAgriculteur } from "../../context/AgriculteurContext";
import { useLots } from "../../context/LotsContext";
import { TypeProduit } from "../../types";
import { Button } from "../../components/ui/Button";
import { ArrowLeftIcon, MapPinIcon, CameraIcon, XIcon, UploadCloudIcon, ImageIcon } from "lucide-react";
import { uploadToCloudinary } from "../../lib/cloudinary";
import { NotificationService } from "../../lib/notifications";
import { db } from "../../lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function NouveauLotScreen() {
  const router = useRouter();
  const { agriculteur } = useAgriculteur();
  const { ajouterLot } = useLots();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCooperativeId, setSelectedCooperativeId] = useState<string | null>(null);
  const [availableCooperatives, setAvailableCooperatives] = useState<any[]>([]);
  const [isLoadingCoops, setIsLoadingCoops] = useState(false);

  // Form state
  const [typeProduit, setTypeProduit] = useState<TypeProduit | null>(null);
  const [poidsKg, setPoidsKg] = useState("");
  const [dateRecolte, setDateRecolte] = useState(new Date().toISOString().split('T')[0]);
  const [gpsCoords, setGpsCoords] = useState<{lat: number, lng: number} | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [notes, setNotes] = useState("");
  const [localityName, setLocalityName] = useState<string | null>(null);

  // Photo state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // --- Shared image processor (file input + drag-drop + paste) ---
  const processImageFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 8 * 1024 * 1024) {
      alert("L'image ne doit pas dépasser 8 Mo.");
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }, []);

  // --- Fetch Cooperatives when component mounts ---
  useEffect(() => {
    const fetchCoops = async () => {
      setIsLoadingCoops(true);
      try {
        const q = query(collection(db, "agriculteurs"), where("secteur", "==", "Coopérative"));
        const snapshot = await getDocs(q);
        const coops: any[] = [];
        snapshot.forEach((doc) => {
          coops.push({ id: doc.id, ...doc.data() });
        });

        // Fallback default coop if empty
        if (coops.length === 0) {
          coops.push({
            id: "default-coop",
            nom: "Coopérative Agri-Togo",
            region: "Plateaux",
          });
        }
        setAvailableCooperatives(coops);
      } catch (error) {
        console.error("Erreur lors de la récupération des coopératives", error);
        setAvailableCooperatives([{
          id: "default-coop",
          nom: "Coopérative Agri-Togo",
          region: "Plateaux",
        }]);
      } finally {
        setIsLoadingCoops(false);
      }
    };
    fetchCoops();
  }, []);

  // --- Paste anywhere on the page (Ctrl+V / Cmd+V) ---
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) processImageFile(file);
          break;
        }
      }
    };
    window.addEventListener("paste", handleGlobalPaste);
    return () => window.removeEventListener("paste", handleGlobalPaste);
  }, [processImageFile]);

  // --- Drag & Drop ---
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processImageFile(file);
  };

  if (!agriculteur) return null;

  const handleNext = () => {
    if (step < 5) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else router.push("/");
  };

  const getLocation = () => {
    setIsLocating(true);
    setLocalityName(null);

    const onSuccess = async (lat: number, lng: number) => {
      setGpsCoords({ lat, lng });
      // --- Reverse geocoding via BigDataCloud (free, no key, fr language) ---
      try {
        const res = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=fr`
        );
        if (res.ok) {
          const data = await res.json();
          // Priority: locality > city > principalSubdivision (region)
          const place =
            data.locality ||
            data.city ||
            data.principalSubdivision ||
            data.countryName ||
            null;
          setLocalityName(place);
        }
      } catch {
        // Reverse geocoding is optional — don't block the flow
      } finally {
        setIsLocating(false);
      }
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          onSuccess(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.warn("Geolocation denied:", error);
          // Demo fallback — Lomé, Togo
          onSuccess(6.1296, 1.2254);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      onSuccess(6.1296, 1.2254);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!typeProduit || !poidsKg || !gpsCoords) return;
    
    setIsSubmitting(true);
    try {
      let photoUrl: string | undefined;

      // Upload photo to Cloudinary if one was selected
      if (photoFile) {
        setIsUploadingPhoto(true);
        const result = await uploadToCloudinary(photoFile);
        photoUrl = result.secure_url;
        setIsUploadingPhoto(false);
      }

      const newLot = await ajouterLot({
        agriculteurId: agriculteur.id,
        agriculteurNom: `${agriculteur.prenom} ${agriculteur.nom}`,
        cooperativeId: selectedCooperativeId || undefined,
        typeProduit: typeProduit,
        poidsKg: parseFloat(poidsKg),
        latitude: gpsCoords.lat,
        longitude: gpsCoords.lng,
        dateRecolte: new Date(dateRecolte),
        notesQualite: notes,
        photoPath: photoUrl,
      });

      // Send local/push notification
      await NotificationService.sendLocalNotification(
        "Lot Enregistré",
        `Le lot ${newLot.lotId} a été créé et scellé avec succès.`
      );

      // Simulate email notification if farmer has email
      if (agriculteur.email) {
        await NotificationService.sendEmail(
          agriculteur.email,
          "Confirmation d'enregistrement - Tracao",
          `Bonjour ${agriculteur.prenom}, votre lot <strong>${newLot.lotId}</strong> a été enregistré sur la blockchain.`
        );
      }

      router.push(`/nouveau-lot/confirmation?id=${newLot.lotId}`);
    } catch (e) {
      console.error(e);
      setIsSubmitting(false);
      setIsUploadingPhoto(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-tracao-cream h-screen">
      <div className="bg-tracao-cacao p-4 text-white flex items-center shadow-sm relative z-10">
        <button onClick={handleBack} className="p-2 -ml-2 rounded-full hover:bg-white/10 active:scale-95 transition-all">
          <ArrowLeftIcon size={24} />
        </button>
        <h1 className="text-lg font-bold ml-2">Nouveau Lot</h1>
      </div>

      {/* Progress bar */}
      <div className="flex h-1.5 bg-tracao-cream-mid">
        <div 
          className="h-full bg-tracao-gold transition-all duration-300"
          style={{ width: `${(step / 5) * 100}%` }}
        />
      </div>

      <div className="flex-1 p-6 overflow-y-auto pb-24">
        {step === 1 && (
          <div className="animate-in slide-in-from-right">
            <h2 className="text-xl font-bold text-tracao-choco mb-2">Quel produit enregistrez-vous ?</h2>
            <p className="text-sm text-tracao-choco-light mb-6">Étape 1 sur 4</p>
            
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setTypeProduit('cacao')}
                className={`p-6 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 transition-all ${typeProduit === 'cacao' ? 'bg-white border-tracao-cacao shadow-md scale-[1.02]' : 'bg-tracao-cream-light border-transparent hover:bg-white text-tracao-choco-light'}`}
              >
                <span className="text-5xl">🍫</span>
                <span className={`font-bold ${typeProduit === 'cacao' ? 'text-tracao-cacao' : ''}`}>Cacao</span>
              </button>
              
              <button 
                onClick={() => setTypeProduit('cafe')}
                className={`p-6 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 transition-all ${typeProduit === 'cafe' ? 'bg-white border-tracao-cacao shadow-md scale-[1.02]' : 'bg-tracao-cream-light border-transparent hover:bg-white text-tracao-choco-light'}`}
              >
                <span className="text-5xl">☕</span>
                <span className={`font-bold ${typeProduit === 'cafe' ? 'text-tracao-cacao' : ''}`}>Café</span>
              </button>
            </div>
            
            <div className="mt-8">
              <Button fullWidth onClick={handleNext} disabled={!typeProduit}>Continuer</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in slide-in-from-right">
            <h2 className="text-xl font-bold text-tracao-choco mb-2">Détails de la récolte</h2>
            <p className="text-sm text-tracao-choco-light mb-6">Étape 2 sur 4</p>
            
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-tracao-choco-light mb-1.5 uppercase tracking-wide">Poids du lot (en kg)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={poidsKg} 
                    onChange={e => setPoidsKg(e.target.value)}
                    className="w-full border border-tracao-border rounded-xl p-4 pr-12 bg-white text-lg font-bold focus:outline-none focus:border-tracao-cacao focus:ring-1 focus:ring-tracao-cacao"
                    placeholder="Ex: 150"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-tracao-choco-pale">kg</span>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-tracao-choco-light mb-1.5 uppercase tracking-wide">Date de récolte</label>
                <input 
                  type="date" 
                  value={dateRecolte} 
                  onChange={e => setDateRecolte(e.target.value)}
                  className="w-full border border-tracao-border rounded-xl p-4 bg-white text-lg focus:outline-none focus:border-tracao-cacao focus:ring-1 focus:ring-tracao-cacao"
                />
              </div>
            </div>
            
            <div className="mt-8">
              <Button fullWidth onClick={handleNext} disabled={!poidsKg}>Continuer</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in slide-in-from-right">
            <h2 className="text-xl font-bold text-tracao-choco mb-2">Localisation du lot (EUDR)</h2>
            <p className="text-sm text-tracao-choco-light mb-6">Étape 3 sur 4</p>
            
            <div className="bg-tracao-cream-light p-5 rounded-2xl border border-tracao-border-light text-center">
              <div className="w-16 h-16 bg-tracao-cream-mid rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPinIcon size={32} className="text-tracao-cacao" />
              </div>
              <h3 className="font-bold text-tracao-choco mb-2">Coordonnées GPS requises</h3>
              <p className="text-xs text-tracao-choco-light mb-6">
                Pour respecter les normes européennes anti-déforestation, nous devons lier ce lot au lieu exact de la récolte.
              </p>
              
              {!gpsCoords ? (
                <Button fullWidth onClick={getLocation} disabled={isLocating}>
                  {isLocating ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Acquisition GPS...
                    </span>
                  ) : "Capturer la position actuelle"}
                </Button>
              ) : (
                <div className="space-y-3">
                  {/* Locality name badge */}
                  {localityName && (
                    <div className="flex items-center justify-center gap-2 bg-tracao-cacao/10 border border-tracao-cacao/20 rounded-xl py-2.5 px-4">
                      <MapPinIcon size={16} className="text-tracao-cacao shrink-0" />
                      <span className="font-bold text-tracao-cacao text-sm">{localityName}</span>
                    </div>
                  )}
                  {/* Success card */}
                  <div className="bg-tracao-forest-light border border-[#B8D8A0] p-4 rounded-xl text-tracao-forest">
                    <p className="font-bold text-sm mb-1">Position enregistrée ✓</p>
                    <p className="text-xs font-mono opacity-70">
                      {gpsCoords.lat.toFixed(6)}° N, {gpsCoords.lng.toFixed(6)}° E
                    </p>
                  </div>
                  {/* Re-capture link */}
                  <button
                    type="button"
                    onClick={getLocation}
                    className="text-xs text-tracao-choco-pale underline underline-offset-2 hover:text-tracao-cacao transition-colors w-full text-center"
                  >
                    Recapturer la position
                  </button>
                </div>
              )}
            </div>
            
            <div className="mt-8">
              <Button fullWidth onClick={handleNext} disabled={!gpsCoords}>Continuer</Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="animate-in slide-in-from-right">
            <h2 className="text-xl font-bold text-tracao-choco mb-2">Informations finales</h2>
            <p className="text-sm text-tracao-choco-light mb-6">Étape 4 sur 4</p>
            
            <div className="space-y-5">
              {/* Hidden native file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoSelect}
              />

              {/* Photo Upload Zone */}
              {!photoPreview ? (
                <div
                  ref={dropZoneRef}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`w-full border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer select-none transition-all ${
                    isDragging
                      ? "border-tracao-cacao bg-tracao-cacao/5 scale-[1.01]"
                      : "border-tracao-border bg-tracao-cream-light hover:bg-white hover:border-tracao-cacao hover:text-tracao-cacao text-tracao-choco-pale"
                  } group`}
                >
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                    isDragging ? "bg-tracao-cacao text-white scale-110" : "bg-tracao-cream-mid group-hover:scale-105"
                  }`}>
                    <UploadCloudIcon size={28} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold">
                      {isDragging ? "Relâchez pour importer" : "Importer une photo du lot"}
                    </p>
                    <p className="text-xs mt-0.5 opacity-70">
                      {isDragging ? "" : "Glisser-déposer · Coller (Ctrl+V) · Cliquer"}
                    </p>
                  </div>
                  {!isDragging && (
                    <div className="flex items-center gap-2 flex-wrap justify-center">
                      <span className="text-[10px] bg-tracao-cream-mid px-2.5 py-1 rounded-full font-semibold">JPG</span>
                      <span className="text-[10px] bg-tracao-cream-mid px-2.5 py-1 rounded-full font-semibold">PNG</span>
                      <span className="text-[10px] bg-tracao-cream-mid px-2.5 py-1 rounded-full font-semibold">WEBP</span>
                      <span className="text-[10px] bg-tracao-cream-mid px-2.5 py-1 rounded-full font-semibold opacity-60">max 8 Mo</span>
                    </div>
                  )}
                </div>
              ) : (
                // Photo preview with overlay actions
                <div className="relative rounded-2xl overflow-hidden border border-tracao-border shadow-sm">
                  <img
                    src={photoPreview}
                    alt="Aperçu du lot"
                    className="w-full h-40 object-cover"
                  />
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  {/* Bottom info */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white">
                      <ImageIcon size={16} />
                      <span className="text-xs font-semibold truncate max-w-[180px]">
                        {photoFile?.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-white/70">
                      {photoFile ? (photoFile.size / 1024 / 1024).toFixed(1) + " Mo" : ""}
                    </span>
                  </div>
                  {/* Remove & change buttons */}
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-black/50 backdrop-blur-sm text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                      title="Changer"
                    >
                      <CameraIcon size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="bg-black/50 backdrop-blur-sm text-white p-2 rounded-full hover:bg-red-500/80 transition-colors"
                      title="Supprimer"
                    >
                      <XIcon size={16} />
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-tracao-choco-light mb-1.5 uppercase tracking-wide">Notes sur la qualité (Optionnel)</label>
                <textarea 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)}
                  className="w-full border border-tracao-border rounded-xl p-4 bg-white focus:outline-none focus:border-tracao-cacao focus:ring-1 focus:ring-tracao-cacao min-h-[100px]"
                  placeholder="Particularités de la récolte, humidité..."
                />
              </div>
            </div>
            
            <div className="mt-8 bg-tracao-cream-mid p-4 rounded-xl border border-tracao-border">
              <p className="text-[10px] text-tracao-choco-mid leading-snug">
                <strong>Attention :</strong> L'enregistrement du lot sur la blockchain est irréversible. Vérifiez que toutes les informations sont correctes.
              </p>
            </div>
            
            <div className="mt-8">
              <Button fullWidth onClick={handleNext}>Continuer</Button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="animate-in slide-in-from-right pb-10">
            <h2 className="text-xl font-bold text-tracao-choco mb-2">Choisir une coopérative</h2>
            <p className="text-sm text-tracao-choco-light mb-4">Étape 5 sur 5</p>
            
            <div className="bg-tracao-cream-mid p-4 rounded-xl border border-tracao-border mb-6">
              <p className="text-[11px] text-tracao-choco leading-relaxed">
                Sélectionnez la coopérative qui recevra ce lot. Nous proposons les coopératives disponibles dans votre région (**{agriculteur.region || "Togo"}**).
              </p>
            </div>

            <div className="space-y-3">
              {isLoadingCoops ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-tracao-border text-tracao-choco-pale">
                  <p className="text-sm font-bold">Recherche des coopératives...</p>
                </div>
              ) : (
                (() => {
                  const filtered = availableCooperatives.filter((c: any) => 
                    !agriculteur.region || !c.region || c.region === agriculteur.region || c.id === 'default-coop'
                  );
                  
                  if (filtered.length === 0) {
                    return (
                      <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-tracao-border text-tracao-choco-pale">
                        <p className="text-sm font-bold">Aucune coopérative trouvée dans votre zone.</p>
                        <p className="text-xs mt-1">Vous pouvez enregistrer le lot sans coopérative pour le moment.</p>
                      </div>
                    );
                  }

                  return filtered.map((coop: any) => (
                    <button
                      key={coop.id}
                      onClick={() => setSelectedCooperativeId(coop.id)}
                      className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${
                        selectedCooperativeId === coop.id 
                        ? 'bg-white border-tracao-cacao shadow-md' 
                        : 'bg-tracao-cream-light border-transparent hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-tracao-cream-mid flex items-center justify-center text-tracao-cacao font-black">
                          {coop.nom ? coop.nom.charAt(0) : "C"}
                        </div>
                        <div className="text-left">
                          <p className={`font-bold text-sm ${selectedCooperativeId === coop.id ? 'text-tracao-cacao' : 'text-tracao-choco'}`}>
                            {coop.nom || "Coopérative Sans Nom"}
                          </p>
                          <p className="text-[10px] text-tracao-choco-pale uppercase font-semibold">{coop.region || "Togo"}</p>
                        </div>
                      </div>
                      {selectedCooperativeId === coop.id && (
                        <div className="w-6 h-6 bg-tracao-cacao text-white rounded-full flex items-center justify-center">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                      )}
                    </button>
                  ));
                })()
              )}
            </div>

            <div className="mt-10 space-y-4">
              <Button fullWidth onClick={handleSubmit} disabled={isSubmitting}>
                {isUploadingPhoto ? "Upload de la photo..." : isSubmitting ? "Enregistrement..." : "Enregistrer et notifier la coopérative"}
              </Button>
              <button 
                onClick={() => {
                  setSelectedCooperativeId(null);
                  handleSubmit();
                }}
                className="w-full py-3 text-xs text-tracao-choco-pale font-bold hover:text-tracao-cacao transition-colors"
              >
                Continuer sans coopérative
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
