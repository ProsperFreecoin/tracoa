import { Agriculteur, Lot } from "../types";

export const DJANGO_API_BASE = "https://tracoa.onrender.com/api";

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

    const text = await res.text();
    let data: any = {};
    
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      data = { detail: text };
    }

    if (!res.ok) {
      throw new Error(JSON.stringify(data));
    }

    return data;
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
    return await res.json();
  } catch (err: any) {
    console.error("ERREUR LOGIN DJANGO:", err);
    throw err;
  }
};

/**
 * Récupère le token JWT depuis localStorage
 */
const getAuthToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("tracao_token");
  }
  return null;
};

/**
 * Helper pour les requêtes authentifiées vers Django
 */
const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers = {
    ...(options.headers || {}),
    ...(token ? { "Authorization": `Bearer ${token}` } : {})
  };

  return fetch(`${DJANGO_API_BASE}${endpoint}`, {
    ...options,
    headers
  });
};

/**
 * Envoie le lot validé vers Django pour insertion dans le Smart Contract Vyper.
 */
export const pushLotToDjangoBlockchain = async (
  lot: Lot,
  producerDjangoId: number,
  coopDjangoId: number,
  producerEmail: string
): Promise<string | null> => {
  try {
    const stockProducerPayload = {
      producer: producerDjangoId,
      cooperative: coopDjangoId,
      weight: lot.poidsKg,
      date: new Date(lot.dateRecolte).toISOString().split('T')[0],
      product_type: lot.typeProduit,
      origin: "Django Mobile",
      surface_size: 0,
      production_size: lot.poidsKg,
      farm_id: lot.farmId
    };

    const spRes = await fetchWithAuth("/stock/stock_producer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(stockProducerPayload)
    });

    if (!spRes.ok) throw new Error("Erreur création StockProducer");
    const spData = await spRes.json();
    const stockProducerId = spData.id;
    const batchNumber = spData.batch_number;

    const stockOriginPayload = {
      cooperative: coopDjangoId,
      producer_stock: stockProducerId,
      is_confirmed: true
    };

    const soRes = await fetchWithAuth("/stock/stock_origin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(stockOriginPayload)
    });

    if (!soRes.ok) throw new Error("Erreur création StockOrigin");

    return batchNumber || `0x${Date.now().toString(16)}a3f7b`; 
  } catch (err) {
    console.error("Impossible de pousser le lot vers Django:", err);
    return null;
  }
};

/**
 * Récupère le profil de l'utilisateur connecté via Django
 */
export const getCurrentUser = async (): Promise<any> => {
  try {
    const token = getAuthToken();
    if (!token) return null;

    // Decode JWT to get user_id
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.user_id;

    if (!userId) return null;

    const res = await fetchWithAuth(`/users/${userId}`);

    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem("tracao_token");
        localStorage.removeItem("tracao_user");
      }
      return null;
    }

    return await res.json();
  } catch (err) {
    console.error("ERREUR GET ME:", err);
    return null;
  }
};

/**
 * Récupère les lots d'un producteur depuis Django
 */
export const getLotsForProducer = async (producerId: number): Promise<any[]> => {
  try {
    const res = await fetchWithAuth(`/stock/producer_stocks/${producerId}`);
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error("ERREUR FETCH PRODUCER STOCKS:", err);
    return [];
  }
};

/**
 * Récupère les lots d'une coopérative depuis Django
 */
export const getLotsForCooperative = async (cooperativeId: number): Promise<any[]> => {
  try {
    const res = await fetchWithAuth(`/stock/cooperative_stocks/${cooperativeId}`);
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error("ERREUR FETCH COOP STOCKS:", err);
    return [];
  }
};

/**
 * Récupère les fermes d'un producteur
 */
export const getFarms = async (): Promise<any[]> => {
  try {
    const res = await fetchWithAuth("/stock/farms");
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error("ERREUR FETCH FARMS:", err);
    return [];
  }
};

