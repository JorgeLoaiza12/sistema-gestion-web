// web/lib/httpClient.ts
import { getSession, signOut } from "next-auth/react";
import type { Session } from "next-auth";

// --- Error Handling (Asumido de tus archivos previos) ---
export enum ErrorType {
  API_REQUEST_FAILED = "API_REQUEST_FAILED",
  API_TIMEOUT = "API_TIMEOUT",
  API_NETWORK_ERROR = "API_NETWORK_ERROR",
  AUTH_SESSION_EXPIRED = "AUTH_SESSION_EXPIRED",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

export interface AppError extends Error {
  type: ErrorType;
  statusCode?: number;
  details?: any;
}

export function createAppError(
  type: ErrorType,
  message: string,
  statusCode?: number,
  details?: any
): AppError {
  const error = new Error(message) as AppError;
  error.type = type;
  error.statusCode = statusCode;
  error.details = details;
  return error;
}

export function logError(error: AppError, additionalContext?: any): void {
  console.error(
    `[AppError] Type: ${error.type}, Status: ${
      error.statusCode || "N/A"
    }, Message: ${error.message}`,
    {
      details: error.details,
      stack: error.stack,
      additionalContext,
    }
  );
}
// --- Fin Error Handling ---

const REQUEST_TIMEOUT = 15000; // 15 segundos, ajústalo según sea necesario
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"; // Asegúrate que tu backend esté en esta URL

interface SessionCache {
  session: Session | null;
  timestamp: number;
  promise?: Promise<Session | null>;
}

let sessionCache: SessionCache | null = null;
const CACHE_EXPIRY_MS = 30 * 1000; // Cachear la sesión por 30 segundos para reducir llamadas a getSession

async function getCachedSession(): Promise<Session | null> {
  const now = Date.now();
  if (sessionCache) {
    if (sessionCache.promise) {
      // console.log("[getCachedSession] Returning existing session promise.");
      return sessionCache.promise;
    }
    if (now - sessionCache.timestamp < CACHE_EXPIRY_MS) {
      // console.log("[getCachedSession] Returning cached session.");
      return sessionCache.session;
    }
  }

  // console.log("[getCachedSession] Cache expired or empty. Fetching new session...");
  const sessionPromise = getSession()
    .then((session) => {
      if (sessionCache && sessionCache.promise === sessionPromise) {
        sessionCache = { session, timestamp: Date.now(), promise: undefined };
      }
      // console.log("[getCachedSession] Fetched new session:", session ? { user: session.user?.id, expires: session.expires, error: (session as any).error } : null);
      return session;
    })
    .catch((err) => {
      console.error("[getCachedSession] Error fetching session:", err);
      if (sessionCache && sessionCache.promise === sessionPromise) {
        sessionCache = {
          session: null,
          timestamp: Date.now(),
          promise: undefined,
        };
      }
      return null;
    });

  sessionCache = { session: null, timestamp: now, promise: sessionPromise };
  return sessionPromise;
}

export function invalidateSessionCache(): void {
  console.log("[invalidateSessionCache] Invalidating session cache.");
  sessionCache = null;
}

function clearAuthCookies(): void {
  if (typeof document === "undefined") return;

  console.log(
    "[clearAuthCookies] Attempting to clear NextAuth cookies from client-side."
  );
  const cookieNames = [
    "next-auth.session-token",
    "next-auth.callback-url",
    "next-auth.csrf-token",
    "__Secure-next-auth.session-token",
    "__Secure-next-auth.callback-url",
    "__Secure-next-auth.csrf-token",
    "__Host-next-auth.session-token", // Para configuraciones más estrictas
  ];

  const domainParts = window.location.hostname.split(".");
  const domainsToTry: string[] = [window.location.hostname]; // Dominio actual

  if (window.location.hostname !== "localhost") {
    domainsToTry.push(`.${window.location.hostname}`); // Con punto al inicio para subdominios
    if (domainParts.length > 2) {
      // Dominio base (ej. .example.com para app.example.com)
      domainsToTry.push(`.${domainParts.slice(-2).join(".")}`);
    }
  }
  const uniqueDomains = [...new Set(domainsToTry)];

  cookieNames.forEach((name) => {
    uniqueDomains.forEach((d) => {
      // Para HTTP y HTTPS (SameSite=Lax es un buen default)
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=${d}; path=/; SameSite=Lax`;
      // Intento para Secure si aplica, aunque SameSite=None requiere Secure
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=${d}; path=/; SameSite=Lax; Secure`;
    });
    // Intento adicional sin especificar dominio (principalmente para localhost o si los otros no funcionan)
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax; Secure`;
  });
  console.log("[clearAuthCookies] Standard NextAuth cookies clear attempted.");
}

async function forceLogoutAndRedirect(reason: string): Promise<void> {
  console.warn(
    `[forceLogoutAndRedirect] Forcing logout and redirect. Reason: "${reason}"`
  );
  invalidateSessionCache();
  clearAuthCookies(); // Limpieza manual de cookies como refuerzo

  try {
    // Intentar signOut para que NextAuth limpie su estado del lado del servidor y cookies HttpOnly
    await signOut({ redirect: false }); // No redirigir desde signOut, lo haremos manualmente
    console.log(
      "[forceLogoutAndRedirect] signOut({ redirect: false }) completed."
    );
  } catch (e) {
    console.error("[forceLogoutAndRedirect] Error during signOut:", e);
  }

  if (typeof window !== "undefined") {
    // Construir la URL de login con la razón como parámetro de error
    let loginUrl = `/login?error=SessionInvalidated&reason=${encodeURIComponent(
      reason
    )}`;
    // Evitar anidar callbackUrl si ya estamos en /login o si es un error muy genérico
    if (window.location.pathname !== "/login") {
      const callbackUrl = encodeURIComponent(
        window.location.pathname + window.location.search
      );
      loginUrl += `&callbackUrl=${callbackUrl}`;
    }

    console.log(`[forceLogoutAndRedirect] Redirecting to: ${loginUrl}`);
    window.location.href = loginUrl; // Redirección forzada del lado del cliente
  }
}

// La función checkAndRefreshToken y otras de tokenService.ts no están siendo usadas activamente
// por httpClient si auth.ts está en modo simplificado sin refresco de backend.
// Se dejan aquí por si se reactiva la lógica de refresco de backend.
// Actualmente, la expiración del accessToken del backend (1h) llevará a 401, y eso
// activará forceLogoutAndRedirect.

type CustomHeadersInit = Record<string, string | undefined>;

interface HttpClientOptions extends Omit<RequestInit, "headers"> {
  headers?: CustomHeadersInit;
  timeout?: number;
  skipErrorHandling?: boolean;
  // skipTokenRefresh?: boolean; // No relevante con auth.ts simplificado
}

export async function httpClient<T = any>(
  url: string,
  options: HttpClientOptions = {}
): Promise<T> {
  const {
    timeout = REQUEST_TIMEOUT,
    skipErrorHandling = false,
    // skipTokenRefresh = true, // Con auth.ts simplificado, no hay refresco de backend que controlar aquí
    ...fetchOptions
  } = options;

  let session: Session | null = null;
  try {
    session = await getCachedSession();
  } catch (sessionError) {
    console.error(
      "[httpClient] Critical error fetching session:",
      sessionError
    );
    await forceLogoutAndRedirect("Error crítico al obtener sesión");
    throw createAppError(
      ErrorType.AUTH_SESSION_EXPIRED,
      "Error crítico al obtener sesión",
      500,
      sessionError
    );
  }

  let logoutReason: string | null = null;

  if (!session) {
    logoutReason = "No session object returned by getSession";
  } else if (!session.user || !session.user.id) {
    logoutReason = "Session user or user.id is missing";
  } else if (!session.accessToken) {
    logoutReason = "Session accessToken is missing";
  } else if ((session as any).error) {
    logoutReason = `Session error property set: ${(session as any).error}`;
  }
  // Adicional: Verificar si el token de NextAuth (no el del backend) está muy cerca de expirar o expiró
  // Esto es por si el callback jwt no logró poner exp=0 a tiempo debido a un timeout de lambda
  const sessionExpiresTimestamp = session?.expires
    ? new Date(session.expires).getTime()
    : 0;
  if (
    sessionExpiresTimestamp &&
    Date.now() >= sessionExpiresTimestamp - 10 * 1000
  ) {
    // 10 segundos de gracia
    logoutReason =
      logoutReason ||
      `NextAuth session itself is expired or expiring very soon (expires: ${session?.expires})`;
  }

  if (logoutReason) {
    console.warn(
      `[httpClient] Invalid session state detected: "${logoutReason}". Forcing logout. Session (condensed):`,
      session
        ? {
            user: session.user?.id,
            expires: session.expires,
            error: (session as any).error,
            accessTokenPresent: !!session.accessToken,
          }
        : "null"
    );
    await forceLogoutAndRedirect(logoutReason);
    // forceLogoutAndRedirect ya lanza un error, pero para typescript:
    throw createAppError(ErrorType.AUTH_SESSION_EXPIRED, logoutReason, 401);
  }

  const accessToken = session!.accessToken as string; // Sabemos que existe por el chequeo anterior

  const baseHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (accessToken) {
    baseHeaders["Authorization"] = `Bearer ${accessToken}`;
  }

  const method = (fetchOptions.method || "GET").toUpperCase();
  // CSRF token no es relevante para este flujo de API Bearer token, a menos que tu backend lo requiera específicamente.

  const mergedHeaders: Record<string, string> = { ...baseHeaders };
  if (fetchOptions.headers) {
    Object.entries(fetchOptions.headers).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        mergedHeaders[key] = String(value);
      }
    });
  }

  const fullUrl = url.startsWith("http")
    ? url
    : `${API_BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.warn(
      `[httpClient] Request to ${method} ${fullUrl} TIMED OUT after ${timeout}ms.`
    );
    controller.abort();
  }, timeout);

  console.log(`[httpClient] Request: ${method} ${fullUrl}`);
  // console.log(`[httpClient] Using accessToken (first 10): ${accessToken ? accessToken.substring(0,10) + '...' : 'N/A'}`);

  try {
    const requestOptions: RequestInit = {
      ...fetchOptions,
      method,
      headers: mergedHeaders,
      credentials: "include", // Importante para que las cookies de NextAuth se envíen si son necesarias para alguna ruta API del frontend
      signal: controller.signal,
    };

    const response = await fetch(fullUrl, requestOptions);
    clearTimeout(timeoutId); // Limpiar el timeout si la respuesta llega

    if (!response.ok) {
      const statusCode = response.status;
      let errorData: any = {
        message: `Error ${statusCode}: ${response.statusText}`,
      };
      try {
        const text = await response.text();
        if (text) {
          errorData = JSON.parse(text);
        }
      } catch (e) {
        // No se pudo parsear el cuerpo del error, usar el statusText
        console.warn(
          `[httpClient] Could not parse error response body for status ${statusCode}.`
        );
      }
      console.warn(
        `[httpClient] API Error: ${method} ${fullUrl} - Status: ${statusCode}`,
        errorData
      );

      if (statusCode === 401) {
        // El backend indica que el token no es válido (expirado o incorrecto)
        await forceLogoutAndRedirect(`API returned 401 for ${method} ${url}`);
        // Esto lanza un error, por lo que no se llegará a la siguiente línea
        throw createAppError(
          ErrorType.AUTH_SESSION_EXPIRED,
          "API Unauthorized",
          statusCode,
          errorData
        );
      }

      const error = createAppError(
        ErrorType.API_REQUEST_FAILED,
        errorData?.message || `Error ${statusCode}: ${response.statusText}`,
        statusCode,
        errorData
      );
      if (!skipErrorHandling) logError(error);
      throw error;
    }

    if (response.status === 204) {
      // No Content
      console.log(
        `[httpClient] Response: ${method} ${fullUrl} - Status: 204 No Content`
      );
      return {} as T;
    }

    const responseText = await response.text();
    try {
      const jsonData = JSON.parse(responseText);
      console.log(
        `[httpClient] Response: ${method} ${fullUrl} - Status: ${response.status}`
      );
      return jsonData as T;
    } catch (e) {
      console.warn(
        `[httpClient] Response for ${method} ${fullUrl} - Status: ${response.status} was not valid JSON. Returning raw text. Error:`,
        e
      );
      return responseText as unknown as T; // Devolver como texto si no es JSON
    }
  } catch (error: unknown) {
    clearTimeout(timeoutId); // Asegurarse de limpiar el timeout en cualquier error

    // Si es un error de aborto por nuestro timeout
    if (error instanceof Error && error.name === "AbortError") {
      const timeoutError = createAppError(
        ErrorType.API_TIMEOUT,
        `Timeout en la petición a ${method} ${url} después de ${timeout}ms`,
        408
      );
      if (!skipErrorHandling) logError(timeoutError);
      throw timeoutError;
    }

    // Si el error ya es un AppError (lanzado por forceLogoutAndRedirect o internamente), simplemente re-lanzarlo
    if (
      typeof error === "object" &&
      error !== null &&
      "type" in error &&
      typeof (error as any).type === "string"
    ) {
      console.warn(
        `[httpClient] Propagating existing AppError: ${
          (error as AppError).type
        } - ${(error as AppError).message}`
      );
      throw error;
    }

    // Para otros errores de red o excepciones inesperadas
    const networkError = createAppError(
      ErrorType.API_NETWORK_ERROR,
      `Error de red o desconocido en ${method} ${url}: ${
        error instanceof Error ? error.message : "Error desconocido"
      }`,
      undefined,
      error // el error original
    );
    if (!skipErrorHandling) logError(networkError);
    throw networkError;
  }
}
