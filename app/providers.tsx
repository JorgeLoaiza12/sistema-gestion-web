"use client";

import { NotificationProvider } from "@/contexts/NotificationContext";
import { SessionProvider } from "@/components/session-provider";
import { ErrorProvider } from "@/components/error-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import { ReactNode } from "react";

/**
 * Componente que proporciona todos los contextos y proveedores necesarios para la aplicación
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <SessionProvider>
        <NotificationProvider>
          <ErrorProvider>
              {children}
          </ErrorProvider>
        </NotificationProvider>
      </SessionProvider>
    </ErrorBoundary>
  );
}