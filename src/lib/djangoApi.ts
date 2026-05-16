import { Agriculteur, Lot } from "../types";

export const DJANGO_API_BASE = "https://tracoa.onrender.com/api";

/** Enregistre un utilisateur dans Django selon son rôle */
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
      const formData = new FormData();
      Object.keys(user).forEach(key => formData.append(key, user[key]));
      formData.append("certification", certificationFile);
      body = formData;
    } else {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(user);
    }

    const res = await fetch(`${DJANGO_API_BASE}${endpoint}`, { method: "POST", headers, body });

    const text = await res.text();
    let data: any = {};
    try { data = text ? JSON.parse(text) : {}; }
    catch (e) { data = { detail: text }; }

    if (!res.ok) throw new Error(JSON.stringify(data));
    return data;
  } catch (err: any) {
    console.error("ERREUR INSCRIPTION DJANGO:", err);
    throw err;
  }
};

/** Login avec Google (Backend support) */
export const loginWithGoogle = async (credential: string): Promise<any> => {
  try {
    const res = await fetch(`${DJANGO_API_BASE}/users/google_login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential })
    });

    if (!res.ok) throw new Error("Erreur lors de la connexion Google.");
    return await res.json();
  } catch (err: any) {
    console.error("ERREUR LOGIN GOOGLE:", err);
    throw err;
  }
};

/** Vérifie l'OTP envoyé par email */
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

/** Upload les documents KYC vers Django */
export const uploadKYC = async (userId: number, idCardFront: File, idCardBack: File, selfie: File): Promise<any> => {
  try {
    const formData = new FormData();
    formData.append("user_id", userId.toString());
    formData.append("id_card_front", idCardFront);
    formData.append("id_card_back", idCardBack);
    formData.append("selfie_photo", selfie);
    const res = await fetch(`${DJANGO_API_BASE}/users/kyc/upload`, { method: "POST", body: formData });
    if (!res.ok) {
      let errorMsg = "Erreur serveur";
      try { const e = await res.json(); errorMsg = JSON.stringify(e); }
      catch { errorMsg = await res.text() || `Erreur ${res.status}`; }
      throw new Error(errorMsg);
    }
    return await res.json();
  } catch (err: any) {
    console.error("ERREUR UPLOAD KYC:", err);
    throw err;
  }
};

/** Login JWT (email + password) */
export const loginUser = async (email: string, password: string): Promise<any> => {
  try {
    const res = await fetch(`${DJANGO_API_BASE}/token/pair`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) throw new Error("Identifiants invalides.");
    return await res.json();
  } catch (err: any) {
    console.error("ERREUR LOGIN DJANGO:", err);
    throw err;
  }
};

/** Récupère le token JWT depuis localStorage */
const getAuthToken = () => {
  if (typeof window !== "undefined") return localStorage.getItem("tracao_token");
  return null;
};

/** Helper pour les requêtes authentifiées vers Django */
const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers = {
    ...(options.headers || {}),
    ...(token ? { "Authorization": `Bearer ${token}` } : {})
  };
  return fetch(`${DJANGO_API_BASE}${endpoint}`, { ...options, headers });
};

/** Récupère le profil de l'utilisateur connecté via Django */
export const getCurrentUser = async (): Promise<any> => {
  try {
    const token = getAuthToken();
    if (!token) return null;

    // Decode JWT to get user_id safely (SSR compatible)
    let payload: any;
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) return null;
      
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = typeof window !== 'undefined' 
        ? decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''))
        : Buffer.from(base64, 'base64').toString();
      
      payload = JSON.parse(jsonPayload);
    } catch (e) {
      console.error("Erreur décodage token:", e);
      return null;
    }

    const userId = payload?.user_id;
    if (!userId) return null;

    const res = await fetchWithAuth(`/users/${userId}`);

    if (!res.ok) {
      if (res.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem("tracao_token");
          localStorage.removeItem("tracao_user");
        }
      }
      return null;
    }

    return await res.json();
  } catch (err) {
    console.error("ERREUR GET ME:", err);
    return null;
  }
};

// =============================================================================
// STOCK / PARCELLES / LOTS (Nouveau modèle de traçabilité)
// =============================================================================

/** Crée une parcelle agricole sur Django */
export const createParcel = async (data: {
  name: string;
  farmer_id: number;
  gps_coordinates: { lat: number; lng: number }[];
  area?: number;
}): Promise<any> => {
  const res = await fetchWithAuth("/stock/parcels", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
};

/** Récupère les parcelles de l'utilisateur connecté */
export const fetchMyParcels = async (): Promise<any[]> => {
  try {
    const res = await fetchWithAuth("/stock/parcels");
    if (!res.ok) return [];
    return await res.json();
  } catch { return []; }
};

/** Crée un lot de récolte sur Django */
export const createBatch = async (data: {
  farmer_id: number;
  parcel_id: string;
  season: string;
  crop_type: string;
  estimated_quantity: number;
  unique_code?: string;
}): Promise<any> => {
  const res = await fetchWithAuth("/stock/batches", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText);
  }
  return await res.json();
};

/** Récupère les lots d'un agriculteur depuis Django */
export const fetchFarmerBatches = async (farmerId: number): Promise<any[]> => {
  try {
    const res = await fetchWithAuth(`/stock/batches?farmer_id=${farmerId}`);
    if (!res.ok) return [];
    return await res.json();
  } catch { return []; }
};

/** Récupère les lots reçus par une coopérative */
export const fetchCooperativeBatches = async (storeId: number): Promise<any[]> => {
  try {
    const res = await fetchWithAuth(`/stock/batches?store_id=${storeId}`);
    if (!res.ok) return [];
    return await res.json();
  } catch { return []; }
};

/** Met à jour le statut d'un lot (réservé aux magasins is_store=true) */
export const updateBatchStatus = async (batchId: string, status: string): Promise<any> => {
  const res = await fetchWithAuth(`/stock/batches/${batchId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
};

/** Met à jour le statut d'une parcelle (réservé aux magasins is_store=true) */
export const updateParcelStatus = async (parcelId: string, status: string): Promise<any> => {
  const res = await fetchWithAuth(`/stock/parcels/${parcelId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
};

// Legacy helpers conservés pour compatibilité
export const getLotsForProducer = fetchFarmerBatches;
export const getLotsForCooperative = fetchCooperativeBatches;
export const getFarms = async (): Promise<any[]> => [];
