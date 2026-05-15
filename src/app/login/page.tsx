"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAgriculteur } from "../../context/AgriculteurContext";
import { useLots } from "../../context/LotsContext";
import { Button } from "../../components/ui/Button";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";

export default function LoginScreen() {
  const router = useRouter();
  const { connecter } = useAgriculteur();
  const { chargerDonneesDemo } = useLots();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAuthSuccess = async (user: any) => {
    // Check if profile exists in Firestore
    const docRef = doc(db, "agriculteurs", user.uid);
    const docSnap = await getDoc(docRef);

    let agriProfile;
    if (docSnap.exists()) {
      agriProfile = docSnap.data() as any;
    } else {
      // Create a default profile if it doesn't exist (e.g. Google Auth for the first time)
      agriProfile = {
        id: user.uid,
        nom: user.displayName?.split(" ")[1] || "",
        prenom: user.displayName?.split(" ")[0] || "Utilisateur",
        email: user.email,
        secteur: "Non défini",
        certifie: false,
      };
      await setDoc(docRef, agriProfile);
    }

    await connecter(agriProfile);
    await chargerDonneesDemo(user.uid);
    // redirection handled by AuthGuard in Context
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      // 1. Connexion Django (Source de vérité pour le Smart Contract)
      const { loginUser } = await import("../../lib/djangoApi");
      const tokens = await loginUser(email, password);
      
      // 2. Connexion Firebase (Pour Firestore et Notifications)
      // On tente Firebase si possible, mais on ne bloque pas si ça échoue (on a le token Django)
      let user;
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        user = userCredential.user;
        await handleAuthSuccess(user);
      } catch (fbErr) {
        console.warn("Firebase login failed, using Django session only:", fbErr);
        // Si Firebase échoue mais Django a réussi, on crée un profil minimal local
        const minimalProfile = {
          id: tokens.user_id || email, // On espère que le token contient l'ID
          email,
          nom: "Utilisateur",
          prenom: "",
          certifie: false,
          secteur: "Inconnu"
        };
        await connecter(minimalProfile as any, tokens.access);
      }
      
    } catch (err: any) {
      console.error(err);
      setError("Email ou mot de passe incorrect.");
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      await handleAuthSuccess(userCredential.user);
    } catch (err: any) {
      console.error(err);
      setError("Erreur lors de la connexion avec Google.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 p-6 bg-tracao-cream h-screen justify-center relative">
      <Link href="/" className="absolute top-6 left-6 p-2 rounded-full hover:bg-tracao-cacao/10 transition-colors text-tracao-cacao" title="Retour à l'accueil">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
      </Link>

      <div className="text-center mb-10 mt-12">
        <h1 className="text-3xl font-extrabold text-tracao-choco tracking-tight">Bienvenue</h1>
        <p className="text-tracao-choco-light mt-2 text-sm">Connectez-vous pour gérer vos récoltes</p>
      </div>

      <div className="bg-tracao-cream-light p-6 rounded-2xl shadow-sm border border-tracao-border-light">
        <h2 className="text-xl font-bold text-tracao-choco mb-6 text-center">Connexion</h2>
        
        {error && (
          <div className="bg-tracao-error-light text-tracao-error text-sm p-3 rounded-lg mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="flex flex-col gap-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-tracao-choco-light mb-1 uppercase tracking-wide">Email</label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-tracao-border rounded-lg p-3 bg-white focus:outline-none focus:border-tracao-cacao focus:ring-1 focus:ring-tracao-cacao"
              placeholder="votre@email.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-tracao-choco-light mb-1 uppercase tracking-wide">Mot de passe</label>
            <input 
              type="password" 
              required 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-tracao-border rounded-lg p-3 bg-white focus:outline-none focus:border-tracao-cacao focus:ring-1 focus:ring-tracao-cacao"
              placeholder="••••••••"
            />
          </div>

          <Button type="submit" fullWidth disabled={isLoading}>
            {isLoading ? "Connexion..." : "Se connecter"}
          </Button>
        </form>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-tracao-border"></div>
          <span className="text-xs text-tracao-choco-pale uppercase font-semibold">Ou</span>
          <div className="flex-1 h-px bg-tracao-border"></div>
        </div>

        <button 
          onClick={handleGoogleLogin} 
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 border border-tracao-border bg-white text-tracao-choco py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
            <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
              <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
              <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
              <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
              <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
            </g>
          </svg>
          Continuer avec Google
        </button>

        <div className="mt-6 text-center">
          <p className="text-sm text-tracao-choco-light">
            Pas encore de compte ?{' '}
            <Link href="/register" className="text-tracao-cacao font-bold hover:underline">
              S'inscrire
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
