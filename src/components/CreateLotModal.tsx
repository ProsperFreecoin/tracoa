"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAgriculteur } from "../context/AgriculteurContext";
import { useLots } from "../context/LotsContext";
import { TypeProduit } from "../types";
import { MapPinIcon, CameraIcon, XIcon, UploadCloudIcon, ImageIcon, SearchIcon } from "lucide-react";
import { uploadToCloudinary } from "../lib/cloudinary";
import { NotificationService } from "../lib/notifications";

export function CreateLotModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { agriculteur } = useAgriculteur();
  const { ajouterLot } = useLots();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form state — matches the screenshot fields
  const [label, setLabel] = useState("");
  const [typeProduit, setTypeProduit] = useState<TypeProduit | null>(null);
  const [saisonDebut, setSaisonDebut] = useState(new Date().getFullYear().toString());
  const [saisonFin, setSaisonFin] = useState((new Date().getFullYear() + 1).toString());
  const [poidsKg, setPoidsKg] = useState("");

  // GPS state
  const [gpsCoords, setGpsCoords] = useState<{lat: number, lng: number} | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [localityName, setLocalityName] = useState<string | null>(null);

  // Photo state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Store search state
  const [storeSearch, setStoreSearch] = useState("");
  const [selectedMagasinId, setSelectedMagasinId] = useState<string | null>(null);
  const [availableMagasins, setAvailableMagasins] = useState<any[]>([]);
  const [isLoadingMagasins, setIsLoadingMagasins] = useState(false);
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);

  // Auto-generated unique code
  const generatedCode = `TRC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;

  // --- Process image file ---
  const processImageFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 8 * 1024 * 1024) {
      alert("L'image ne doit pas dépasser 8 Mo.");
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }, []);

  // --- Fetch stores on mount ---
  useEffect(() => {
    const fetchStores = async () => {
      setIsLoadingMagasins(true);
      try {
        const DJANGO_API_BASE = "https://tracoa.onrender.com/api";
        const res = await fetch(`${DJANGO_API_BASE}/users/all_stores`);
        let stores = res.ok ? await res.json() : [];
        
        // Ajouter des magasins par défaut si la liste est vide (pour le test)
        if (stores.length === 0) {
          stores = [
            { id: "mock-1", store_name: "Magasin Central Lome", address: "Lome, Togo" },
            { id: "mock-2", store_name: "Coopérative Kpalimé", address: "Kpalimé, Togo" },
            { id: "mock-3", store_name: "Entrepôt Atakpamé", address: "Atakpamé, Togo" }
          ];
        }
        setAvailableMagasins(stores);
      } catch (error) {
        console.error("Erreur lors de la récupération des magasins", error);
        // Fallback mock stores
        setAvailableMagasins([
          { id: "mock-1", store_name: "Magasin Central Lome", address: "Lome, Togo" },
          { id: "mock-2", store_name: "Coopérative Kpalimé", address: "Kpalimé, Togo" }
        ]);
      } finally {
        setIsLoadingMagasins(false);
      }
    };
    fetchStores();
  }, []);

  if (!agriculteur) return null;

  // --- GPS ---
  const getLocation = () => {
    setIsLocating(true);
    setLocalityName(null);

    const onSuccess = async (lat: number, lng: number) => {
      setGpsCoords({ lat, lng });
      try {
        const res = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=fr`
        );
        if (res.ok) {
          const data = await res.json();
          const place = data.locality || data.city || data.principalSubdivision || data.countryName || null;
          setLocalityName(place);
        }
      } catch {
        // Reverse geocoding is optional
      } finally {
        setIsLocating(false);
      }
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => onSuccess(position.coords.latitude, position.coords.longitude),
        () => onSuccess(6.1296, 1.2254),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      onSuccess(6.1296, 1.2254);
    }
  };

  // --- Photo ---
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
  };
  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // --- Store search filter ---
  const filteredStores = availableMagasins.filter((s: any) => {
    const name = (s.nom || s.store_name || s.first_name || "").toLowerCase();
    return name.includes(storeSearch.toLowerCase());
  });

  const storeNotFound = storeSearch.trim() !== "" && filteredStores.length === 0 && !isLoadingMagasins;

  // --- Form validation ---
  const canSubmit = typeProduit && poidsKg && !isSubmitting;

  // --- Submit ---
  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      let photoUrl: string | undefined;
      if (photoFile) {
        setIsUploadingPhoto(true);
        const result = await uploadToCloudinary(photoFile);
        photoUrl = result.secure_url;
        setIsUploadingPhoto(false);
      }

      const newLot = await ajouterLot({
        agriculteurId: agriculteur.id,
        agriculteurNom: `${agriculteur.prenom} ${agriculteur.nom}`,
        cooperativeId: selectedMagasinId || undefined,
        typeProduit: typeProduit!,
        poidsKg: parseFloat(poidsKg),
        latitude: gpsCoords?.lat,
        longitude: gpsCoords?.lng,
        dateRecolte: new Date().toISOString(),
        notesQualite: "",
        photoPath: photoUrl,
        label: label || undefined,
        season: `${saisonDebut}-${saisonFin}`,
      });

      // Notification locale
      await NotificationService.sendLocalNotification(
        "Lot Enregistré",
        `Le lot ${newLot.lotId} a été créé avec succès.`
      );

      // Notification au magasin si sélectionné
      if (selectedMagasinId) {
        try {
          const { sendNotification } = await import('../lib/djangoApi');
          await sendNotification({
            receiver_id: parseInt(selectedMagasinId),
            message: `Nouveau lot à valider : ${newLot.lotId} (${typeProduit}, ${poidsKg}kg)`,
            type: "BATCH_PENDING",
            metadata: { batch_id: newLot.id, lot_id: newLot.lotId }
          });
        } catch (err) {
          console.error("Erreur notification magasin:", err);
        }
      }

      if (agriculteur.email) {
        await NotificationService.sendEmail(
          agriculteur.email,
          "Confirmation d'enregistrement - Tracao",
          `Bonjour ${agriculteur.prenom}, votre lot <strong>${newLot.lotId}</strong> a été enregistré.`
        );
      }

      onClose();
      router.push("/mes-lots");
    } catch (e: any) {
      console.error(e);
      setSubmitError(e.message || "Erreur lors de l'enregistrement.");
      setIsSubmitting(false);
      setIsUploadingPhoto(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-tracao-choco">Création d&apos;un nouveau lot</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XIcon size={18} />
          </button>
        </div>

        {/* Form body — scrollable */}
        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">

          {/* Code auto-généré (lecture seule) */}
          <div>
            <input
              type="text"
              value={generatedCode}
              readOnly
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm text-gray-400 font-mono cursor-not-allowed"
            />
          </div>

          {/* Libellé du lot */}
          <div>
            <input
              type="text"
              placeholder="Entrer le libellé du lot"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full border border-gray-200 rounded-xl py-3 px-4 text-sm text-tracao-choco placeholder:text-gray-400 focus:outline-none focus:border-tracao-cacao focus:ring-1 focus:ring-tracao-cacao transition-colors"
            />
          </div>

          {/* Choix de culture */}
          <div>
            <label className="block text-sm font-semibold text-tracao-choco mb-3">Choix de culture</label>
            <div className="flex gap-4">
              <label
                className={`flex items-center gap-2.5 px-5 py-2.5 rounded-full border cursor-pointer transition-all text-sm font-medium ${
                  typeProduit === "cacao"
                    ? "border-tracao-cacao bg-tracao-cacao/5 text-tracao-cacao"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="culture"
                  value="cacao"
                  checked={typeProduit === "cacao"}
                  onChange={() => setTypeProduit("cacao")}
                  className="accent-tracao-cacao w-4 h-4"
                />
                Cacao
              </label>
              <label
                className={`flex items-center gap-2.5 px-5 py-2.5 rounded-full border cursor-pointer transition-all text-sm font-medium ${
                  typeProduit === "cafe"
                    ? "border-tracao-cacao bg-tracao-cacao/5 text-tracao-cacao"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="culture"
                  value="cafe"
                  checked={typeProduit === "cafe"}
                  onChange={() => setTypeProduit("cafe")}
                  className="accent-tracao-cacao w-4 h-4"
                />
                Café
              </label>
            </div>
          </div>

          {/* Magasin (recherche) */}
          <div className="relative">
            <label className="block text-sm font-semibold text-tracao-choco mb-2">Magasin destinataire</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher un magasin..."
                value={storeSearch}
                onChange={(e) => {
                  setStoreSearch(e.target.value);
                  setShowStoreDropdown(true);
                  // Auto-match exact
                  const match = availableMagasins.find((m: any) =>
                    (m.nom || m.store_name || "").toLowerCase() === e.target.value.toLowerCase()
                  );
                  if (match) setSelectedMagasinId(match.id);
                  else setSelectedMagasinId(null);
                }}
                onFocus={() => setShowStoreDropdown(true)}
                className="w-full border border-gray-200 rounded-xl py-3 px-4 pr-10 text-sm text-tracao-choco placeholder:text-gray-400 focus:outline-none focus:border-tracao-cacao focus:ring-1 focus:ring-tracao-cacao transition-colors"
              />
              <SearchIcon size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>

            {/* Dropdown results */}
            {showStoreDropdown && storeSearch.trim() !== "" && (
              <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                {isLoadingMagasins ? (
                  <p className="p-3 text-xs text-gray-400 text-center">Chargement...</p>
                ) : storeNotFound ? (
                  <div className="p-3">
                    <p className="text-xs font-semibold text-amber-600">Ce magasin n&apos;est pas encore inscrit.</p>
                    <button 
                      onClick={() => {
                        // On autorise la saisie libre pour le moment
                        setSelectedMagasinId(null);
                        setShowStoreDropdown(false);
                      }}
                      className="mt-2 w-full py-1.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors"
                    >
                      Utiliser ce nom quand même
                    </button>
                  </div>
                ) : (
                  filteredStores.map((store: any) => (
                    <button
                      key={store.id}
                      onClick={() => {
                        setSelectedMagasinId(store.id);
                        setStoreSearch(store.nom || store.store_name || store.first_name || "");
                        setShowStoreDropdown(false);
                      }}
                      className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center justify-between transition-colors ${
                        selectedMagasinId === store.id ? "bg-tracao-cacao/5 text-tracao-cacao font-semibold" : "text-tracao-choco"
                      }`}
                    >
                      <span>{store.nom || store.store_name || store.first_name || "Magasin"}</span>
                      {selectedMagasinId === store.id && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Définir la saison */}
          <div>
            <label className="block text-sm font-semibold text-tracao-choco mb-2">Définir la saison</label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <input
                  type="number"
                  placeholder="Année de début"
                  value={saisonDebut}
                  onChange={(e) => setSaisonDebut(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl py-3 px-4 text-sm text-tracao-choco placeholder:text-gray-400 focus:outline-none focus:border-tracao-cacao focus:ring-1 focus:ring-tracao-cacao"
                />
              </div>
              <div className="relative flex-1">
                <input
                  type="number"
                  placeholder="Année de fin"
                  value={saisonFin}
                  onChange={(e) => setSaisonFin(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl py-3 px-4 text-sm text-tracao-choco placeholder:text-gray-400 focus:outline-none focus:border-tracao-cacao focus:ring-1 focus:ring-tracao-cacao"
                />
              </div>
            </div>
          </div>

          {/* Quantité estimée */}
          <div>
            <div className="relative">
              <input
                type="number"
                placeholder="Quantité estimée en kilogramme (kg)"
                value={poidsKg}
                onChange={(e) => setPoidsKg(e.target.value)}
                className="w-full border border-gray-200 rounded-xl py-3 px-4 pr-12 text-sm text-tracao-choco placeholder:text-gray-400 focus:outline-none focus:border-tracao-cacao focus:ring-1 focus:ring-tracao-cacao"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">kg</span>
            </div>
          </div>

          {/* GPS Capture */}
          <div>
            <label className="block text-sm font-semibold text-tracao-choco mb-2">Coordonnées GPS</label>
            {!gpsCoords ? (
              <button
                onClick={getLocation}
                disabled={isLocating}
                className="w-full border border-dashed border-gray-300 rounded-xl py-3 px-4 text-sm text-gray-500 hover:border-tracao-cacao hover:text-tracao-cacao hover:bg-tracao-cacao/5 transition-all flex items-center justify-center gap-2"
              >
                {isLocating ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Acquisition GPS...
                  </>
                ) : (
                  <>
                    <MapPinIcon size={16} />
                    Capturer la position actuelle
                  </>
                )}
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl py-2.5 px-4">
                <MapPinIcon size={14} className="text-green-600 shrink-0" />
                <span className="text-xs font-semibold text-green-700">
                  {localityName ? `${localityName} — ` : ""}
                  {gpsCoords.lat.toFixed(4)}°, {gpsCoords.lng.toFixed(4)}°
                </span>
                <button onClick={getLocation} className="ml-auto text-[10px] text-green-600 underline hover:text-green-800">
                  Recapturer
                </button>
              </div>
            )}
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-semibold text-tracao-choco mb-2">Photo du lot (optionnel)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoSelect}
            />
            {!photoPreview ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border border-dashed border-gray-300 rounded-xl py-3 px-4 text-sm text-gray-500 hover:border-tracao-cacao hover:text-tracao-cacao hover:bg-tracao-cacao/5 transition-all flex items-center justify-center gap-2"
              >
                <UploadCloudIcon size={16} />
                Importer une photo
              </button>
            ) : (
              <div className="relative rounded-xl overflow-hidden border border-gray-200">
                <img src={photoPreview} alt="Aperçu" className="w-full h-32 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-white">
                    <ImageIcon size={12} />
                    <span className="text-[10px] font-semibold truncate max-w-[150px]">{photoFile?.name}</span>
                  </div>
                </div>
                <div className="absolute top-1.5 right-1.5 flex gap-1.5">
                  <button onClick={() => fileInputRef.current?.click()} className="bg-black/50 text-white p-1.5 rounded-full hover:bg-black/70" title="Changer">
                    <CameraIcon size={12} />
                  </button>
                  <button onClick={handleRemovePhoto} className="bg-black/50 text-white p-1.5 rounded-full hover:bg-red-500/80" title="Supprimer">
                    <XIcon size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Error message */}
          {submitError && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-xs text-red-600 font-semibold">{submitError}</p>
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${
              canSubmit
                ? "bg-tracao-choco text-white hover:bg-tracao-cacao active:scale-[0.98]"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {isUploadingPhoto ? "Upload photo..." : isSubmitting ? "Enregistrement..." : "Créer le lot"}
          </button>
        </div>
      </div>
    </div>
  );
}
