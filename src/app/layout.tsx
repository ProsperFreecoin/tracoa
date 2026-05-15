import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "../components/Providers";
import { BottomNav } from "../components/ui/BottomNav";
import { SideNav } from "../components/ui/SideNav";
import { PageTransition } from "../components/ui/PageTransition";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tracao · Traçabilité Cacao-Café",
  description: "Application de traçabilité blockchain pour agriculteurs togolais (Café & Cacao)",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Tracao",
  },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Tracao · Traçabilité Cacao-Café",
    description: "Application de traçabilité blockchain pour agriculteurs togolais",
    images: ["/favicon.png"],
  }
};

export const viewport: Viewport = {
  themeColor: "#7B3F00",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-zinc-100 text-tracao-choco">
        <Providers>
          <div className="flex min-h-screen">
            <SideNav />
            <div className="flex-1 flex flex-col min-h-screen lg:bg-zinc-100 overflow-hidden">
              <div className="flex-1 flex flex-col w-full max-w-3xl lg:max-w-none mx-auto lg:mx-0">
                <div className="flex-1 flex flex-col bg-tracao-cream lg:bg-transparent min-h-screen shadow-2xl lg:shadow-none pb-[65px] lg:pb-0 overflow-hidden">
                  <PageTransition>
                    {children}
                  </PageTransition>
                </div>
              </div>
            </div>
          </div>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
