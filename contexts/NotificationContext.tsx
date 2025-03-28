"use client";

import React, { createContext, useContext, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

type NotificationType = "success" | "error" | "warning" | "info";

interface NotificationContextProps {
  addNotification: (
    type: NotificationType,
    message: string,
    action?: {
      label: string;
      onClick: () => void;
    }
  ) => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(
  undefined
);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { toast } = useToast();

  const addNotification = (
    type: NotificationType,
    message: string,
    action?: {
      label: string;
      onClick: () => void;
    }
  ) => {
    const icon = getNotificationIcon(type);

    toast({
      variant: type === "error" ? "destructive" : "default",
      title: getNotificationTitle(type),
      description: message,
      action: action ? (
        <ToastAction altText={action.label} onClick={action.onClick}>
          {action.label}
        </ToastAction>
      ) : undefined,
      icon,
      duration: 5000,
    });
  };

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case "success":
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case "error":
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    case "warning":
      return <AlertTriangle className="h-5 w-5 text-amber-500" />;
    case "info":
      return <Info className="h-5 w-5 text-blue-500" />;
    default:
      return <Info className="h-5 w-5" />;
  }
}

function getNotificationTitle(type: NotificationType): string {
  switch (type) {
    case "success":
      return "Éxito";
    case "error":
      return "Error";
    case "warning":
      return "Advertencia";
    case "info":
      return "Información";
    default:
      return "";
  }
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification debe ser usado dentro de un NotificationProvider"
    );
  }
  return context;
}
