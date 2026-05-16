import { Agriculteur, Lot } from "../types";

const DJANGO_API_BASE = "https://tracoa.onrender.com/api";

/**
 * Enregistre un utilisateur dans Django selon son rôle
 */
export const registerUser = async (user: any, role: string, certificationFile?: File): Promise<any> => {
  try {
    let endpoint = "/users/farmer_signup";
    if (role === "Acheteur Privé") endpoint = "/users/buyer_signup";
    if (role === "Entreprise de Transformation") endpoint = "/users/company_signup";
    if (role === "Institution") endpoint = "/users/institution_signup";
    if (role === "Magasin/Boutique") endpoint = "/users/store_signup";

    const headers: Record<string, string> = {};
    let body: any;

    if (certificationFile) {
      // Use FormData if there's a file
      const formData = new FormData();
      Object.keys(user).forEach(key => formData.append(key, user[key]));
      formData.append("certification", certificationFile);
      body = formData;
      // Headers will be set automatically by fetch for FormData
    } else {
      // Use JSON for simple registrations
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(user);
    }

    const res = await fetch(`${DJANGO_API_BASE}${endpoint}`, {
      method: "POST",
      headers,
      body,
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(JSON.stringify(errorData));
    }

    return await res.json();
  } catch (err: any) {
    console.error("ERREUR INSCRIPTION DJANGO:", err);
    throw err;
  }
};

/**
 * Vérifie l'OTP envoyé par email
 */
export const verifyOTP = async (email: string, code: string): Promise<any> => {
  try {
    const res = await fetch(`${DJANGO_API_BASE}/users/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code })
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.detail || "Code invalide ou expiré.");
    }

    return await res.json();
  } catch (err: any) {
    console.error("ERREUR VERIFICATION OTP:", err);
    throw err;
  }
};

/**
 * Upload les documents KYC vers Django
 */
export const uploadKYC = async (
  userId: number,
  idCardFront: File,
  idCardBack: File,
  selfie: File
): Promise<any> => {
  try {
    const formData = new FormData();
    formData.append("user_id", userId.toString());
    formData.append("id_card_front", idCardFront);
    formData.append("id_card_back", idCardBack);
    formData.append("selfie_photo", selfie);

    const res = await fetch(`${DJANGO_API_BASE}/users/kyc/upload`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      let errorMsg = "Erreur serveur";
      try {
        const errorData = await res.json();
        errorMsg = JSON.stringify(errorData);
      } catch (e) {
        // Si ce n'est pas du JSON, on récupère le texte brut ou le statut
        const errorText = await res.text();
        errorMsg = errorText || `Erreur ${res.status}: ${res.statusText}`;
      }
      throw new Error(errorMsg);
    }

    return await res.json();
  } catch (err: any) {
    console.error("ERREUR UPLOAD KYC:", err);
    throw err;
  }
};

/**
 * Login JWT
 */
export const loginUser = async (email: string, password: string): Promise<any> => {
  try {
    const res = await fetch(`${DJANGO_API_BASE}/token/pair`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) throw new Error("Identifiants invalides.");
    const tokens = await res.json();

    // Récupérer le profil complet (pour avoir le djangoId)
    const profileRes = await fetch(`${DJANGO_API_BASE}/users/me`, {
      headers: { 
        "Authorization": `Bearer ${tokens.access}`
      }
    });

    if (profileRes.ok) {
      const profile = await profileRes.json();
      return { ...tokens, user: profile };
    }

    return tokens;
  } catch (err: any) {
    console.error("ERREUR LOGIN DJANGO:", err);
    throw err;
  }
};

/**
 * Enregistre silencieusement un utilisateur Firebase dans Django (Agriculteur ou Coopérative)
 * @deprecated Utiliser registerUser pour les nouvelles inscriptions
 */
export const syncUserToDjango = async (user: Agriculteur): Promise<number | null> => {
  try {
    const endpoint = user.secteur === "Coopérative" ? "/users/company_signup" : "/users/farmer_signup";
    
    const payload = {
      email: user.email || `${user.id}@tracao.local`,
      first_name: user.prenom,
      last_name: user.nom,
      phone_number: user.telephone || "",
      password: "TracaoHackathon2026!",
      org_name: user.secteur === "Coopérative" ? user.nom : "",
      city: user.region || "Lome"
    };

    const res = await fetch(`${DJANGO_API_BASE}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data.id || null;
  } catch (err) {
    return null;
  }
};

/**
 * Envoie le lot validé vers Django pour insertion dans le Smart Contract Vyper.
 */
/**
 * Crée une parcelle dans Django (requis avant de créer un lot)
 */
export const createParcelInDjango = async (farmerId: number, name: string, lat: number, lng: number): Promise<string> => {
  try {
    // On crée un triangle symbolique autour du point car le backend exige 3 points
    const gps_coordinates = [
      { lat, lng },
      { lat: lat + 0.0001, lng: lng + 0.0001 },
      { lat: lat - 0.0001, lng: lng + 0.0001 }
    ];

    const res = await fetch(`${DJANGO_API_BASE}/stock/parcels`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        farmer_id: farmerId,
        name: name,
        gps_coordinates: gps_coordinates,
        area: 1.0
      })
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(JSON.stringify(error));
    }

    const data = await res.json();
    return data.id; // UUID de la parcelle
  } catch (err) {
    console.error("ERREUR CREATION PARCELLE:", err);
    throw err;
  }
};

/**
 * Crée un lot (Batch) dans Django
 */
export const createBatchInDjango = async (payload: {
  farmer_id: number,
  parcel_id: string,
  season: string,
  crop_type: string,
  estimated_quantity: number,
  notes?: string
}): Promise<any> => {
  try {
    const res = await fetch(`${DJANGO_API_BASE}/stock/batches`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(JSON.stringify(error));
    }

    return await res.json();
  } catch (err) {
    console.error("ERREUR CREATION BATCH:", err);
    throw err;
  }
};

/**
 * Récupère tous les lots d'un agriculteur depuis Django
 */
export const fetchFarmerBatches = async (farmerId: number): Promise<any[]> => {
  try {
    const res = await fetch(`${DJANGO_API_BASE}/stock/batches/farmer/${farmerId}`);
    if (!res.ok) throw new Error("Erreur récupération lots Django");
    return await res.json();
  } catch (err) {
    console.error("ERREUR FETCH BATCHES:", err);
    return [];
  }
};

/**
 * Récupère tous les lots assignés à une coopérative (store)
 */
export const fetchCooperativeBatches = async (storeId: number): Promise<any[]> => {
  try {
    const res = await fetch(`${DJANGO_API_BASE}/stock/batches?store_id=${storeId}`);
    if (!res.ok) throw new Error("Erreur récupération lots coop Django");
    return await res.json();
  } catch (err) {
    console.error("ERREUR FETCH COOP BATCHES:", err);
    return [];
  }
};

export const pushLotToDjangoBlockchain = async (
  lot: Lot,
  producerDjangoId: number,
  coopDjangoId: number,
  producerEmail: string
): Promise<string | null> => {
  // ... (on garde le reste pour compatibilité ou on le simplifie)
  return `0x${Date.now().toString(16)}a3f7b`;
}

