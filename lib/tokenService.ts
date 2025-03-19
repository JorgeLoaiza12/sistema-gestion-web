/**
 * Servicio para gestionar tokens de autenticación y renovación automática
 */

import { signIn } from "next-auth/react";

// Tiempo antes de la expiración para intentar renovar el token (5 minutos)
const REFRESH_TOKEN_THRESHOLD = 5 * 60 * 1000; // 5 minutos en milisegundos

// Almacenamiento de timers de renovación para evitar duplicados
let refreshTimers: Record<string, NodeJS.Timeout> = {};

/**
 * Decodifica un token JWT sin necesidad de bibliotecas externas
 * @param token El token JWT a decodificar
 * @returns El payload decodificado o null si el token no es válido
 */
export function decodeJWT(token: string): any {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error decodificando JWT:", error);
    return null;
  }
}

/**
 * Verifica si un token JWT está próximo a expirar
 * @param token El token JWT a verificar
 * @returns true si el token expirará pronto, false de lo contrario
 */
export function isTokenExpiringSoon(token: string): boolean {
  const payload = decodeJWT(token);

  if (!payload || !payload.exp) {
    return true; // Si no podemos verificar, asumir que está por expirar
  }

  const expirationTime = payload.exp * 1000; // Convertir a milisegundos
  const currentTime = Date.now();

  // Verificar si el token expirará dentro del umbral definido
  return expirationTime - currentTime < REFRESH_TOKEN_THRESHOLD;
}

/**
 * Programa la renovación automática de un token antes de que expire
 * @param token El token JWT actual
 * @param userId Identificador del usuario para evitar múltiples renovaciones
 */
export function scheduleTokenRefresh(token: string, userId: string) {
  // Cancelar cualquier timer existente para este usuario
  if (refreshTimers[userId]) {
    clearTimeout(refreshTimers[userId]);
  }

  const payload = decodeJWT(token);

  if (!payload || !payload.exp) {
    console.warn(
      "Token sin información de expiración, no se puede programar renovación"
    );
    return;
  }

  const expirationTime = payload.exp * 1000; // Convertir a milisegundos
  const currentTime = Date.now();

  // Si el token ya expiró, no programar renovación
  if (expirationTime <= currentTime) {
    console.warn("Token ya expirado, no se programa renovación");
    return;
  }

  const timeUntilRefresh = Math.max(
    0,
    expirationTime - currentTime - REFRESH_TOKEN_THRESHOLD
  );

  // Máximo un intento cada 30 segundos para evitar ciclos
  const refreshDelay = Math.max(timeUntilRefresh, 30000);

  // Programar la renovación del token
  let refreshAttempts = 0;
  const MAX_ATTEMPTS = 3;

  refreshTimers[userId] = setTimeout(async () => {
    try {
      // Evitar muchos intentos seguidos
      if (refreshAttempts >= MAX_ATTEMPTS) {
        console.warn(
          `Demasiados intentos de renovación (${refreshAttempts}). Suspendiendo renovación automática.`
        );
        return;
      }

      refreshAttempts++;

      // Intentar renovar el token silenciosamente
      const result = await signIn("refresh", { redirect: false });

      if (result?.error) {
        console.error("Error al renovar el token:", result.error);
        // No reprogramar si hay un error crítico
      } else {
        console.log("Token renovado exitosamente");
        refreshAttempts = 0; // Reiniciar contador de intentos tras éxito
      }
    } catch (error) {
      console.error("Error durante la renovación del token:", error);
    }
  }, refreshDelay);

  console.log(
    `Token programado para renovación en ${Math.floor(
      refreshDelay / 1000 / 60
    )} minutos`
  );
}

/**
 * Limpia todos los timers de renovación
 */
export function clearAllRefreshTimers() {
  Object.values(refreshTimers).forEach((timer) => clearTimeout(timer));
  refreshTimers = {};
}

/**
 * Genera un token CSRF aleatorio
 * @returns Token CSRF generado
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}

/**
 * Almacena un token CSRF en sessionStorage
 * @param csrfToken El token CSRF a almacenar
 */
export function storeCSRFToken(csrfToken: string): void {
  if (typeof window !== "undefined") {
    sessionStorage.setItem("csrfToken", csrfToken);
  }
}

/**
 * Recupera el token CSRF de sessionStorage
 * @returns El token CSRF almacenado o null si no existe
 */
export function getStoredCSRFToken(): string | null {
  if (typeof window !== "undefined") {
    return sessionStorage.getItem("csrfToken");
  }
  return null;
}

/**
 * Verifica si un token CSRF es válido
 * @param token El token CSRF a verificar
 * @returns true si el token es válido, false de lo contrario
 */
export function validateCSRFToken(token: string): boolean {
  const storedToken = getStoredCSRFToken();
  return storedToken === token;
}
