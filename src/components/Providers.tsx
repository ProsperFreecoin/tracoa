"use client";

import { ReactNode } from "react";
import { AgriculteurProvider } from "../context/AgriculteurContext";
import { LotsProvider } from "../context/LotsContext";
import { NotificationProvider } from "../context/NotificationContext";
import { useEffect } from "react";
import { NotificationService } from "../lib/notifications";

export default function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Initialisation des notifications push
    NotificationService.initPush().catch(console.error);
  }, []);

  return (
    <AgriculteurProvider>
      <NotificationProvider>
        <LotsProvider>
          {children}
        </LotsProvider>
      </NotificationProvider>
    </AgriculteurProvider>
  );
}
