// web/lib/httpClient.ts
import { getSession, signOut } from "next-auth/react";
import type { Session } from "next-auth";

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

const REQUEST_TIMEOUT = 15000;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

interface SessionCache {
  session: Session | null;
  timestamp: number;
  promise?: Promise<Session | null>;
}

let sessionCache: SessionCache | null = null;
const CACHE_EXPIRY_MS = 30 * 1000;

async function getCachedSession(): Promise<Session | null> {
  const now = Date.now();
  if (sessionCache) {
    if (sessionCache.promise) {
      return sessionCache.promise;
    }
    if (now - sessionCache.timestamp < CACHE_EXPIRY_MS) {
      return sessionCache.session;
    }
  }

  const sessionPromise = getSession()
    .then((session) => {
      if (sessionCache && sessionCache.promise === sessionPromise) {
        sessionCache = { session, timestamp: Date.now(), promise: undefined };
      }
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
  const cookieNames = [
    "next-auth.session-token",
    "next-auth.callback-url",
    "next-auth.csrf-token",
    "__Secure-next-auth.session-token",
    "__Secure-next-auth.callback-url",
    "__Secure-next-auth.csrf-token",
    "__Host-next-auth.session-token",
  ];
  const domainParts = window.location.hostname.split(".");
  const domainsToTry: string[] = [window.location.hostname];
  if (window.location.hostname !== "localhost") {
    domainsToTry.push(`.${window.location.hostname}`);
    if (domainParts.length > 2) {
      domainsToTry.push(`.${domainParts.slice(-2).join(".")}`);
    }
  }
  const uniqueDomains = [...new Set(domainsToTry)];
  cookieNames.forEach((name) => {
    uniqueDomains.forEach((d) => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=${d}; path=/; SameSite=Lax`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=${d}; path=/; SameSite=Lax; Secure`;
    });
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax; Secure`;
  });
}

async function forceLogoutAndRedirect(reason: string): Promise<void> {
  console.warn(
    `[forceLogoutAndRedirect] Forcing logout and redirect. Reason: "${reason}"`
  );
  invalidateSessionCache();
  clearAuthCookies();

  try {
    await signOut({ redirect: false });
  } catch (e) {
    console.error("[forceLogoutAndRedirect] Error during signOut:", e);
  }

  if (typeof window !== "undefined") {
    let loginUrl = `/login?error=SessionInvalidated&reason=${encodeURIComponent(
      reason
    )}`;
    if (window.location.pathname !== "/login") {
      const callbackUrl = encodeURIComponent(
        window.location.pathname + window.location.search
      );
      loginUrl += `&callbackUrl=${callbackUrl}`;
    }
    window.location.href = loginUrl;
  }
}

type CustomHeadersInit = Record<string, string | undefined>;

interface HttpClientOptions extends Omit<RequestInit, "headers"> {
  headers?: CustomHeadersInit;
  timeout?: number;
  skipErrorHandling?: boolean;
  responseType?: "json" | "blob" | "text"; // Nueva opción
}

export async function httpClient<T = any>(
  url: string,
  options: HttpClientOptions = {}
): Promise<T> {
  const {
    timeout = REQUEST_TIMEOUT,
    skipErrorHandling = false,
    responseType = "json", // Por defecto json
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
  const sessionExpiresTimestamp = session?.expires
    ? new Date(session.expires).getTime()
    : 0;
  if (
    sessionExpiresTimestamp &&
    Date.now() >= sessionExpiresTimestamp - 10 * 1000
  ) {
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
    throw createAppError(ErrorType.AUTH_SESSION_EXPIRED, logoutReason, 401);
  }

  const accessToken = session!.accessToken as string;

  const baseHeaders: Record<string, string> = {
    Accept: "application/json", // Mantenemos Accept application/json por defecto
  };
  // Solo añadir Content-Type si no es FormData (fetch lo hace automáticamente para FormData)
  if (!(fetchOptions.body instanceof FormData)) {
    baseHeaders["Content-Type"] = "application/json";
  }

  if (accessToken) {
    baseHeaders["Authorization"] = `Bearer ${accessToken}`;
  }

  const method = (fetchOptions.method || "GET").toUpperCase();

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
      let errorData: any = {
        message: `Error ${statusCode}: ${response.statusText}`,
      };
      try {
        const text = await response.text();
        if (text) {
          errorData = JSON.parse(text);
        }
      } catch (e) {
        console.warn(
          `[httpClient] Could not parse error response body for status ${statusCode}.`
        );
      }
      console.warn(
        `[httpClient] API Error: ${method} ${fullUrl} - Status: ${statusCode}`,
        errorData
      );

      if (statusCode === 401) {
        await forceLogoutAndRedirect(`API returned 401 for ${method} ${url}`);
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
      console.log(
        `[httpClient] Response: ${method} ${fullUrl} - Status: 204 No Content`
      );
      return {} as T;
    }

    if (responseType === "blob") {
      return response.blob() as unknown as T;
    }

    const responseText = await response.text();
    if (responseType === "text") {
      return responseText as unknown as T;
    }

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
      return responseText as unknown as T;
    }
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === "AbortError") {
      const timeoutError = createAppError(
        ErrorType.API_TIMEOUT,
        `Timeout en la petición a ${method} ${url} después de ${timeout}ms`,
        408
      );
      if (!skipErrorHandling) logError(timeoutError);
      throw timeoutError;
    }

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

    const networkError = createAppError(
      ErrorType.API_NETWORK_ERROR,
      `Error de red o desconocido en ${method} ${url}: ${
        error instanceof Error ? error.message : "Error desconocido"
      }`,
      undefined,
      error
    );
    if (!skipErrorHandling) logError(networkError);
    throw networkError;
  }
}
