"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAgriculteur } from "../../context/AgriculteurContext";

export function BottomNav() {
  const pathname = usePathname();
  const { estConnecte } = useAgriculteur();

  // Never show on auth pages, if not connected, or on desktop (lg+) SideNav takes over
  if (!estConnecte || pathname === '/login' || pathname === '/register') return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-tracao-cream-light border-t border-tracao-border flex justify-around items-center h-[65px] z-50 px-2 pb-safe">
      <NavItem href="/" icon={<HomeIcon size={22} />} label="Accueil" isActive={pathname === '/'} />
      <NavItem href="/nouveau-lot" icon={<PlusCircleIcon size={22} />} label="Nouveau" isActive={pathname === '/nouveau-lot'} />
      <NavItem href="/suivi" icon={<HistoryIcon size={22} />} label="Suivi" isActive={pathname === '/suivi'} />
      <NavItem href="/mes-lots" icon={<ListIcon size={22} />} label="Mes Lots" isActive={pathname === '/mes-lots'} />
      <NavItem href="/profil" icon={<SettingsIcon size={22} />} label="Profil" isActive={pathname === '/profil'} />
    </div>
  );
}

function NavItem({ href, icon, label, isActive }: { href: string; icon: React.ReactNode; label: string; isActive: boolean }) {
  const colorClass = isActive ? "text-tracao-cacao" : "text-tracao-choco-pale";
  const weightClass = isActive ? "font-semibold" : "font-medium";

  return (
    <Link href={href} className={`flex flex-col items-center justify-center gap-1 w-16 h-full ${colorClass}`}>
      {icon}
      <span className={`text-[11px] ${weightClass}`}>{label}</span>
    </Link>
  );
}
