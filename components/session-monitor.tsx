"use client";

import { useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useNotification } from "@/contexts/NotificationContext";

export function SessionMonitor() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { addNotification } = useNotification();

  useEffect(() => {
    // Solo ejecuta cuando se tiene sesión y estamos en una ruta protegida
    if (status !== "authenticated" || !pathname.startsWith("/dashboard")) {
      return;
    }

    // Función para verificar si el token JWT ha expirado
    const checkTokenExpiration = async () => {
      try {
        // Obtener la sesión actual del endpoint /api/auth/session
        const response = await fetch("/api/auth/session");
        const sessionData = await response.json();

        if (!sessionData || !sessionData.user) {
          // Si no hay usuario en la sesión, significa que ha expirado
          addNotification(
            "error",
            "Tu sesión ha expirado. Por favor, vuelve a iniciar sesión."
          );
          await signOut({ redirect: false });
          router.push("/login");
        }
      } catch (error) {
        console.error("Error verificando la sesión:", error);
      }
    };

    // Verificar al montar el componente
    checkTokenExpiration();

    // Configurar verificación periódica (cada 5 minutos)
    const intervalId = setInterval(checkTokenExpiration, 5 * 60 * 1000);

    // Evento de actividad del usuario para mantener la sesión activa
    const activityEvents = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
    ];

    // Contador de inactividad (30 minutos en milisegundos)
    const inactivityTime = 30 * 60 * 1000;
    let inactivityTimer: NodeJS.Timeout;

    // Función para reiniciar el temporizador de inactividad
    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(async () => {
        addNotification(
          "warning",
          "Has estado inactivo por mucho tiempo. Tu sesión se cerrará automáticamente."
        );
        await signOut({ redirect: false });
        router.push("/login");
      }, inactivityTime);
    };

    // Iniciar el temporizador de inactividad
    resetInactivityTimer();

    // Añadir event listeners para resetear el timer cuando hay actividad
    activityEvents.forEach((event) => {
      window.addEventListener(event, resetInactivityTimer);
    });

    // Cleanup
    return () => {
      clearInterval(intervalId);
      clearTimeout(inactivityTimer);
      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetInactivityTimer);
      });
    };
  }, [status, pathname, router, addNotification]);

  // Este componente no renderiza nada, solo monitorea la sesión
  return null;
}
