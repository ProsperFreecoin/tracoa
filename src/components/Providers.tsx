"use client";

import { ReactNode } from "react";
import { AgriculteurProvider } from "../context/AgriculteurContext";
import { LotsProvider } from "../context/LotsContext";
import { NotificationProvider } from "../context/NotificationContext";
import { useEffect } from "react";
import { NotificationService } from "../lib/notifications";
import { GoogleOAuthProvider } from '@react-oauth/google';

export default function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Initialisation des notifications push
    NotificationService.initPush().catch(console.error);
  }, []);

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AgriculteurProvider>
        <NotificationProvider>
          <LotsProvider>
            {children}
          </LotsProvider>
        </NotificationProvider>
      </AgriculteurProvider>
    </GoogleOAuthProvider>
  );
}
