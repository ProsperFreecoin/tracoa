"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAgriculteur } from "./AgriculteurContext";

export interface Notification {
  id: number;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
  metadata: any;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: number) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { agriculteur } = useAgriculteur();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshNotifications = useCallback(async () => {
    if (!agriculteur) return;
    
    try {
      const { DJANGO_API_BASE } = await import("../lib/djangoApi");
      const token = localStorage.getItem("tracao_token");
      if (!token) return;

      const res = await fetch(`${DJANGO_API_BASE}/users/notifications`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        setUnreadCount(data.filter((n: Notification) => !n.is_read).length);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des notifications", error);
    }
  }, [agriculteur]);

  useEffect(() => {
    refreshNotifications();
    // Poll every 30 seconds for real-time feel
    const interval = setInterval(refreshNotifications, 30000);
    return () => clearInterval(interval);
  }, [refreshNotifications]);

  const markAsRead = async (id: number) => {
    try {
      const { DJANGO_API_BASE } = await import("../lib/djangoApi");
      const token = localStorage.getItem("tracao_token");
      
      const res = await fetch(`${DJANGO_API_BASE}/users/notifications/${id}/read`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Erreur lors du marquage de la notification", error);
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, refreshNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotifications must be used within NotificationProvider");
  return context;
}
