// components/auth/auth-refresh-provider.tsx
"use client";

import { useSession } from "next-auth/react";
import { useEffect, ReactNode, useRef } from "react";
import {
  scheduleTokenRefresh,
  clearAllRefreshTimers,
  isTokenExpiringSoon,
} from "@/lib/tokenService";
import { useRouter } from "next/navigation";
import { useNotification } from "@/contexts/NotificationContext";

interface AuthRefreshProviderProps {
  children: ReactNode;
}

export default function AuthRefreshProvider({
  children,
}: AuthRefreshProviderProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { addNotification } = useNotification();
  const refreshingRef = useRef(false);

  useEffect(() => {
    // Si el usuario está autenticado
    if (status === "authenticated" && session?.accessToken) {
      const userId = session.user.id;
      const token = session.accessToken;

      // Evitar múltiples intentos simultáneos
      if (refreshingRef.current) {
        return;
      }

      // Verificar si el token está próximo a expirar
      if (isTokenExpiringSoon(token)) {
        refreshingRef.current = true;
        addNotification(
          "warning",
          "Tu sesión está por expirar. Renovando automáticamente..."
        );

        // Después de un intento, resetear el flag
        setTimeout(() => {
          refreshingRef.current = false;
        }, 10000); // 10 segundos de espera entre intentos
      }

      // Programar renovación del token solo si no está por expirar inmediatamente
      if (!refreshingRef.current) {
        scheduleTokenRefresh(token, userId);
      }
    }

    // Limpiar los timers al desmontar el componente
    return () => {
      clearAllRefreshTimers();
    };
  }, [session, status, addNotification]);

  // Este componente no renderiza nada, solo gestiona la renovación de tokens
  return <>{children}</>;
}
