"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAgriculteur } from "../../context/AgriculteurContext";
import { useLots } from "../../context/LotsContext";
import { Button } from "../../components/ui/Button";
import { loginUser, getCurrentUser, loginWithGoogle } from "../../lib/djangoApi";
import { GoogleLogin } from '@react-oauth/google';

const DotsLoader = () => (
  <div className="flex justify-center items-center gap-1.5 h-6">
    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
  </div>
);

export default function LoginScreen() {
  const router = useRouter();
  const { connecter } = useAgriculteur();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAuthSuccess = async (tokens: any) => {
    // 1. Sauvegarder le token
    localStorage.setItem("tracao_token", tokens.access);

    // 2. Récupérer le profil complet depuis Django
    const user = await getCurrentUser();
    if (user) {
      const mappedAgri = {
        id: user.id.toString(),
        djangoId: user.id,
        nom: user.last_name || user.org_name || "Nom",
        prenom: user.first_name || "",
        email: user.email,
        telephone: user.phone_number,
        region: user.situation_geo,
        certifie: user.is_verified,
        secteur: user.is_farmer ? "Agriculteur" : 
                 user.is_store ? "Magasin/Boutique" : 
                 user.is_transformer ? "Entreprise de Transformation" : 
                 user.is_certifier ? "Organisme de Certification" : "Institution",
        kycStatut: user.kyc_document?.status?.toLowerCase() || 'non_soumis'
      };
      await connecter(mappedAgri as any, tokens.access);
      return true;
    }
    return false;
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      // 1. Connexion Django uniquement
      const tokens = await loginUser(email, password);
      const success = await handleAuthSuccess(tokens);
      if (success) {
        router.push("/");
      } else {
        setError("Erreur lors de la récupération du profil.");
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error(err);
      setError("Email ou mot de passe incorrect.");
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
            {isLoading ? <DotsLoader /> : "Se connecter"}
          </Button>
        </form>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-tracao-border-light"></div>
          <span className="text-xs font-bold text-tracao-choco-light opacity-50 uppercase tracking-wider">ou</span>
          <div className="flex-1 h-px bg-tracao-border-light"></div>
        </div>
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
