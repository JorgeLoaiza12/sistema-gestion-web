// web/lib/httpClient.ts
/**
 * Cliente HTTP mejorado con manejo de errores, renovación de tokens y compatible con CORS
 */

import { createAppError, ErrorType, logError } from "@/lib/errorHandler";
import { isTokenExpiringSoon, decodeJWT } from "@/lib/tokenService"; // Asumiendo que decodeJWT existe
import { getSession, signIn, signOut } from "next-auth/react";
import { Session } from "next-auth";

const REQUEST_TIMEOUT = 30000;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

interface SessionCache {
  session: Session | null;
  timestamp: number;
  promise?: Promise<Session | null>;
}

let sessionCache: SessionCache | null = null;
const CACHE_EXPIRY = 1 * 60 * 1000; // Reducir caché de sesión a 1 minuto para forzar re-fetch más seguido si es necesario

function getCsrfToken(): string {
  if (typeof window !== "undefined") {
    return sessionStorage.getItem("csrfToken") || "";
  }
  return "";
}

async function getCachedSession(): Promise<Session | null> {
  const now = Date.now();
  if (sessionCache && now - sessionCache.timestamp < CACHE_EXPIRY) {
    if (sessionCache.promise) {
      return sessionCache.promise;
    }
    return sessionCache.session;
  }

  const sessionPromise = getSession()
    .then((session) => {
      sessionCache = { session, timestamp: Date.now(), promise: undefined };
      console.log(
        "[getCachedSession] Fetched new session:",
        session
          ? {
              user: session.user,
              expires: session.expires,
              error: (session as any).error,
            }
          : null
      );
      return session;
    })
    .catch((err) => {
      console.error("[getCachedSession] Error fetching session:", err);
      sessionCache = {
        session: null,
        timestamp: Date.now(),
        promise: undefined,
      }; // Limpiar en caso de error
      return null;
    });

  sessionCache = { session: null, timestamp: now, promise: sessionPromise };
  return sessionPromise;
}

function invalidateSessionCache(): void {
  console.log("[invalidateSessionCache] Invalidating session cache.");
  sessionCache = null;
}

function clearAuthCookies() {
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
    "__Host-next-auth.session-token",
  ];

  // Para localhost y dominios sin subdominios específicos
  const domainParts = window.location.hostname.split(".");
  const domains = [
    window.location.hostname, // Dominio actual
    `.${window.location.hostname}`, // Con punto al inicio
  ];
  // Añadir dominio base si es diferente (ej. app.example.com -> .example.com)
  if (domainParts.length > 2) {
    domains.push(`.${domainParts.slice(-2).join(".")}`);
  }
  const uniqueDomains = [...new Set(domains)];

  cookieNames.forEach((name) => {
    uniqueDomains.forEach((d) => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=${d}; path=/; SameSite=Lax`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=${d}; path=/; SameSite=None; Secure`; // Para HTTPS
    });
    // Intento adicional sin especificar dominio (útil para localhost)
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=None; Secure`;
  });
  console.log(
    "[clearAuthCookies] Standard NextAuth cookies cleared (attempted)."
  );
  sessionStorage.removeItem("csrfToken"); // Limpiar también de sessionStorage si lo usas
}

async function forceLogoutAndRedirect(reason: string) {
  console.warn(`[forceLogoutAndRedirect] Forcing logout due to: ${reason}`);
  invalidateSessionCache();
  clearAuthCookies(); // Limpieza manual de cookies

  try {
    await signOut({ redirect: false }); // Intentar que NextAuth limpie su estado
    console.log(
      "[forceLogoutAndRedirect] signOut({ redirect: false }) completed."
    );
  } catch (e) {
    console.error("[forceLogoutAndRedirect] Error during signOut:", e);
  }

  if (typeof window !== "undefined") {
    const loginUrl = `/login?error=SessionExpired&reason=${encodeURIComponent(
      reason
    )}`;
    console.log(`[forceLogoutAndRedirect] Redirecting to: ${loginUrl}`);
    window.location.href = loginUrl; // Redirección forzada
  }
  // Lanzar un error para detener cualquier procesamiento posterior en httpClient
  throw createAppError(ErrorType.AUTH_SESSION_EXPIRED, reason, 401);
}

async function checkAndRefreshToken(
  accessToken: string
): Promise<string | null> {
  const payload = decodeJWT(accessToken);
  const isExpiring =
    payload && payload.exp && payload.exp * 1000 - Date.now() < 5 * 60 * 1000;

  if (isExpiring) {
    console.log(
      "[checkAndRefreshToken] Token is expiring soon or has expired. Attempting refresh via NextAuth signIn('refresh')."
    );
    try {
      // signIn('refresh') internamente debería actualizar la sesión y el token
      // si el callback 'jwt' y la ruta '/api/auth/refresh' están bien configurados.
      // No devuelve el token directamente, necesitamos obtener la sesión actualizada.
      const result = await signIn("refresh", { redirect: false }); // Esto llama al callback jwt con trigger='signIn' y provider='refresh'

      if (result?.error) {
        console.error(
          "[checkAndRefreshToken] signIn('refresh') resulted in an error:",
          result.error
        );
        await forceLogoutAndRedirect(`Refresh Signin Error: ${result.error}`);
        return null; // No se pudo refrescar
      }

      // Forzar la re-obtención de la sesión para obtener el token actualizado
      invalidateSessionCache();
      const updatedSession = await getCachedSession();
      const newAccessToken = updatedSession?.accessToken as string | undefined;

      if (!newAccessToken) {
        console.error(
          "[checkAndRefreshToken] Refreshed session does not contain a new accessToken."
        );
        await forceLogoutAndRedirect("No new token after refresh");
        return null;
      }
      console.log(
        "[checkAndRefreshToken] Token refreshed successfully via signIn('refresh')."
      );
      return newAccessToken;
    } catch (error) {
      console.error(
        "[checkAndRefreshToken] Exception during signIn('refresh'):",
        error
      );
      await forceLogoutAndRedirect(
        `Refresh Exception: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return null; // No se pudo refrescar
    }
  }
  return accessToken; // Devolver el token original si no necesita refresco
}

type CustomHeadersInit = Record<string, string | undefined>;

interface HttpClientOptions extends Omit<RequestInit, "headers"> {
  headers?: CustomHeadersInit;
  timeout?: number;
  skipErrorHandling?: boolean;
  skipTokenRefresh?: boolean; // Para controlar si se intenta el refresco
}

export async function httpClient<T = any>(
  url: string,
  options: HttpClientOptions = {}
): Promise<T> {
  const {
    timeout = REQUEST_TIMEOUT,
    skipErrorHandling = false,
    skipTokenRefresh = false,
    ...fetchOptions
  } = options;

  let session = await getCachedSession();

  // Si la sesión de NextAuth tiene un error de refresco, forzar logout
  if (session && (session as any).error === "RefreshFailed") {
    console.warn(
      "[httpClient] Session indicates previous RefreshFailed. Forcing logout."
    );
    await forceLogoutAndRedirect("Previous token refresh failed");
    // forceLogoutAndRedirect lanza un error, por lo que la ejecución aquí se detendría.
    // Pero para type safety, devolvemos algo aunque no se alcance:
    return Promise.reject(
      createAppError(ErrorType.AUTH_SESSION_EXPIRED, "Refresh failed", 401)
    );
  }

  let accessToken = session?.accessToken as string | undefined;

  if (accessToken && !skipTokenRefresh) {
    const refreshedToken = await checkAndRefreshToken(accessToken);
    if (refreshedToken) {
      accessToken = refreshedToken;
    } else {
      // Si checkAndRefreshToken devuelve null, es porque forzó un logout o hubo un error crítico.
      // La ejecución ya debería haberse detenido por el error lanzado en forceLogoutAndRedirect.
      console.error(
        "[httpClient] Token refresh failed and resulted in null, should have redirected."
      );
      // Este throw es una salvaguarda.
      throw createAppError(
        ErrorType.AUTH_SESSION_EXPIRED,
        "Fallo crítico en la renovación del token.",
        401
      );
    }
  }

  const baseHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (accessToken) {
    baseHeaders["Authorization"] = `Bearer ${accessToken}`;
  }

  const method = (fetchOptions.method || "GET").toUpperCase();
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      baseHeaders["X-CSRF-Token"] = csrfToken;
    }
  }

  const mergedHeaders: Record<string, string> = { ...baseHeaders };
  if (fetchOptions.headers) {
    Object.entries(fetchOptions.headers).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        mergedHeaders[key] = value;
      }
    });
  }

  const fullUrl = url.startsWith("http")
    ? url
    : `${API_BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  console.log(`[httpClient] Request: ${method} ${fullUrl}`);
  if (accessToken) {
    console.log(
      `[httpClient] Using accessToken (first 10): ${accessToken.substring(
        0,
        10
      )}...`
    );
  } else {
    console.log("[httpClient] No accessToken for this request.");
  }

  try {
    const requestOptions: RequestInit = {
      ...fetchOptions,
      method,
      headers: mergedHeaders,
      credentials: "include",
      signal: controller.signal,
    };

    const response = await fetch(fullUrl, requestOptions);
    clearTimeout(timeoutId);

    if (!response.ok) {
      const statusCode = response.status;
      let errorData = null;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = {
          message: (await response.text()) || `Error ${statusCode}`,
        };
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
      return {} as T;
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      try {
        return (await response.json()) as T;
      } catch (e) {
        console.warn(
          "[httpClient] Error parsing JSON response despite Content-Type header:",
          e
        );
        return {} as T; // O lanzar un error específico de parseo
      }
    } else if (contentType && contentType.includes("text/")) {
      const text = await response.text();
      try {
        return JSON.parse(text) as T;
      } catch {
        return text as unknown as T;
      }
    }
    return response as unknown as T; // Para otros tipos de contenido (binarios, etc.)
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === "AbortError") {
      const timeoutError = createAppError(
        ErrorType.API_TIMEOUT,
        `Timeout en ${method} ${url}`,
        408
      );
      if (!skipErrorHandling) logError(timeoutError);
      throw timeoutError;
    }

    // Si el error ya es un AppError (lanzado por forceLogoutAndRedirect por ejemplo), simplemente re-lanzarlo
    if (
      typeof error === "object" &&
      error !== null &&
      "type" in error &&
      "message" in error
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
      `Error de red en ${method} ${url}: ${
        error instanceof Error ? error.message : "Error desconocido"
      }`,
      undefined,
      error
    );
    if (!skipErrorHandling) logError(networkError);
    throw networkError;
  }
}
