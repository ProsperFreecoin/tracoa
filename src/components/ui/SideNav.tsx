"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, ListIcon, SettingsIcon, LogOutIcon, HistoryIcon } from "lucide-react";
import { useAgriculteur } from "../../context/AgriculteurContext";

import { ArrowRightLeftIcon, UsersIcon, HexagonIcon, FileTextIcon } from "lucide-react";

const farmerNavItems = [
  { href: "/", icon: HomeIcon, label: "Accueil" },
  { href: "/suivi", icon: HistoryIcon, label: "Suivi des Lots" },
  { href: "/mes-lots", icon: ListIcon, label: "Mes Lots" },
  { href: "/transactions", icon: ArrowRightLeftIcon, label: "Transactions" },
  { href: "/profil", icon: SettingsIcon, label: "Profil" },
];

const coopNavCategories = [
  {
    title: "GESTION",
    items: [
      { href: "/cooperative", icon: ListIcon, label: "Lots à vérifier" },
      { href: "/cooperative/transferts", icon: ArrowRightLeftIcon, label: "Expéditions" },
      { href: "/cooperative/membres", icon: UsersIcon, label: "Producteurs" },
    ]
  },
  {
    title: "BLOCKCHAIN",
    items: [
      { href: "/cooperative/registre", icon: HexagonIcon, label: "Registre" },
      { href: "/cooperative/rapports", icon: FileTextIcon, label: "Rapports EUDR" },
    ]
  },
  {
    title: "ADMIN",
    items: [
      { href: "/profil", icon: SettingsIcon, label: "Paramètres" },
    ]
  }
];

export function SideNav() {
  const pathname = usePathname();
  const { agriculteur, deconnecter } = useAgriculteur();

  if (!agriculteur) return null;

  const isMagasinier = agriculteur.secteur === "Magasinier";
  const isCoopLegacy = agriculteur.secteur === "Coopérative";
  const isCoop = isMagasinier || isCoopLegacy;

  return (
    <aside className={`hidden lg:flex flex-col w-64 min-h-screen shrink-0 sticky top-0 ${
      isCoop ? 'bg-[#F4ECD8] text-tracao-choco' : 'bg-tracao-choco text-white'
    }`}>
      {/* Logo */}
      <div className={`px-6 py-8 border-b ${isCoop ? 'border-tracao-choco/10' : 'border-white/10'}`}>
        <div className="flex items-center gap-3">
          <img src="/icon-192.png" alt="Tracao Logo" className="w-8 h-8 object-contain" />
          <div>
            <h1 className="text-xl font-black tracking-tight">Tracao</h1>
          </div>
        </div>
      </div>

      {/* User profile */}
      <div className={`px-4 py-5 border-b ${isCoop ? 'border-tracao-choco/10 hidden' : 'border-white/10'}`}>
        <div className={`flex items-center gap-3 rounded-xl p-3 ${isCoop ? 'bg-tracao-choco/5' : 'bg-white/5'}`}>
          <div className="w-10 h-10 rounded-full bg-tracao-gold flex items-center justify-center text-tracao-choco font-black text-lg shrink-0 overflow-hidden">
            {agriculteur.photoUrl ? (
              <img src={agriculteur.photoUrl} alt="Photo de profil" className="w-full h-full object-cover" />
            ) : (
              <span>{agriculteur.prenom.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold truncate">{agriculteur.prenom} {agriculteur.nom}</p>
            <p className={`text-[11px] truncate ${isCoop ? 'text-tracao-choco/60' : 'text-white/50'}`}>{agriculteur.secteur || agriculteur.region || "Agriculteur"}</p>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 px-3 flex flex-col gap-1 overflow-y-auto">
        {isCoop ? (
          // Cooperative Navigation (Categorized)
          coopNavCategories.map((category, idx) => (
            <div key={idx} className={idx > 0 ? "mt-4" : ""}>
              <p className="px-4 mb-2 text-[10px] font-bold text-tracao-choco/50 tracking-widest uppercase">{category.title}</p>
              <div className="flex flex-col gap-1">
                {category.items.map(({ href, icon: Icon, label }) => {
                  const isActive = pathname === href || (href !== '/cooperative' && pathname.startsWith(href));
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-center gap-3.5 px-4 py-2.5 rounded-xl font-bold transition-all ${
                        isActive
                          ? "bg-[#EED596] text-tracao-choco shadow-sm"
                          : "text-tracao-choco/70 hover:text-tracao-choco hover:bg-tracao-choco/5"
                      }`}
                    >
                      <Icon size={18} />
                      <span className="text-sm">{label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          // Farmer Navigation (Flat)
          farmerNavItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl font-semibold transition-all ${
                  isActive
                    ? "bg-tracao-cacao text-white shadow-lg"
                    : "text-white/60 hover:text-white hover:bg-white/10"
                }`}
              >
                <Icon size={20} />
                <span className="text-sm">{label}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-tracao-gold" />}
              </Link>
            );
          })
        )}
      </nav>

      {/* Logout */}
      <div className={`p-4 border-t ${isCoop ? 'border-tracao-choco/10' : 'border-white/10'}`}>
        <button
          onClick={() => deconnecter()}
          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors w-full ${
            isCoop 
            ? 'text-tracao-choco/60 hover:text-tracao-error hover:bg-tracao-error/10' 
            : 'text-white/50 hover:text-tracao-rust-light hover:bg-white/5'
          }`}
        >
          <LogOutIcon size={18} />
          <span className="text-sm font-semibold">Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
