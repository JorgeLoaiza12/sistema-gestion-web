// web\lib\httpClient.ts
/**
 * Cliente HTTP mejorado con manejo de errores, renovación de tokens y compatible con CORS
 */

import { createAppError, ErrorType, logError } from "@/lib/errorHandler";
import { isTokenExpiringSoon } from "@/lib/tokenService";
import { getSession, signIn, signOut } from "next-auth/react";
import { Session } from "next-auth";

// Tiempo de espera para solicitudes (30 segundos)
const REQUEST_TIMEOUT = 30000;

// URL base de la API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// Definir tipo para la caché de sesión
interface SessionCache {
  session: Session | null;
  timestamp: number;
  promise?: Promise<Session | null>;
}

// Cache para sesión y token
let sessionCache: SessionCache | null = null;

// Tiempo de caducidad de la caché (5 minutos)
const CACHE_EXPIRY = 5 * 60 * 1000;

/**
 * Obtiene un token CSRF para incluir en solicitudes que modifican datos
 */
function getCsrfToken(): string {
  if (typeof window !== "undefined") {
    // Intentar obtener el token CSRF de las cookies
    const csrfCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("csrf="))
      ?.split("=")[1];

    if (csrfCookie) {
      return csrfCookie;
    }

    // Si no hay cookie, ver si hay un token en sessionStorage como fallback
    return sessionStorage.getItem("csrfToken") || "";
  }
  return "";
}

/**
 * Función para obtener la sesión con caché para evitar llamadas repetidas
 */
async function getCachedSession(): Promise<Session | null> {
  const now = Date.now();

  // Si existe caché válida, retornarla. Si además hay una promesa en curso, la retornamos.
  if (sessionCache && now - sessionCache.timestamp < CACHE_EXPIRY) {
    if (sessionCache.promise) {
      return sessionCache.promise;
    }
    return sessionCache.session;
  }

  // Si no hay caché o ha expirado, creamos una nueva promesa para obtener la sesión
  const sessionPromise = getSession().then((session) => {
    // Actualizamos la caché sin la promesa (ya que se resolvió)
    sessionCache = { session, timestamp: now };
    return session;
  });

  // Almacenamos la promesa en la caché para que las llamadas concurrentes la usen
  sessionCache = { session: null, timestamp: now, promise: sessionPromise };

  return sessionPromise;
}

/**
 * Función para invalidar la caché de sesión
 */
function invalidateSessionCache(): void {
  sessionCache = null;
}

/**
 * Verifica y renueva el token si está por expirar
 */
async function checkAndRefreshToken(accessToken: string): Promise<string> {
  // Si el token está por expirar, intentar renovarlo
  if (isTokenExpiringSoon(accessToken)) {
    try {
      console.log("Token por expirar, intentando renovación silenciosa");

      // Intentar renovar el token silenciosamente
      const result = await signIn("refresh", { redirect: false });

      if (result?.error) {
        console.error("Error al renovar el token:", result.error);
        throw new Error("No se pudo renovar el token de acceso");
      }

      // Obtener el nuevo token de la sesión actualizada
      invalidateSessionCache(); // Invalidar caché para forzar obtención de nueva sesión
      const updatedSession = await getCachedSession();
      const newToken = updatedSession?.accessToken as string | undefined;

      if (!newToken) {
        throw new Error(
          "No se pudo obtener un nuevo token después de la renovación"
        );
      }

      console.log("Token renovado exitosamente");
      return newToken;
    } catch (error) {
      console.error("Error durante la renovación del token:", error);
      throw error; // Propagar el error para manejo superior
    }
  }

  // Si el token no está por expirar, devolverlo sin cambios
  return accessToken;
}

/**
 * Maneja el caso de sesión expirada
 */
async function handleExpiredSession(statusCode: number, errorData: any) {
  invalidateSessionCache(); // Limpiar caché de sesión

  const error = createAppError(
    ErrorType.AUTH_SESSION_EXPIRED,
    errorData?.message ||
      "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
    statusCode,
    errorData
  );

  // Si estamos en el navegador, iniciar proceso de logout
  if (typeof window !== "undefined") {
    try {
      // Primero intentamos hacer un signOut limpio con nextAuth
      await signOut({ redirect: false });

      // Obtener URL actual para redirigir después del login
      const currentPath = window.location.pathname;
      const loginUrl = `/login${
        currentPath !== "/login"
          ? `?callbackUrl=${encodeURIComponent(currentPath)}`
          : ""
      }`;

      // Redirigir después de una pequeña pausa
      setTimeout(() => {
        window.location.href = loginUrl;
      }, 100);
    } catch (logoutError) {
      console.error("Error durante el logout:", logoutError);
      // Si falla el signOut, forzar redirección al login
      window.location.href = "/login";
    }
  }

  return error;
}

/**
 * Cliente HTTP mejorado con manejo de errores y compatible con CORS
 */
// Definir tipo para headers personalizados que sea compatible con HeadersInit
type CustomHeadersInit = Record<string, string | undefined>;

interface HttpClientOptions extends Omit<RequestInit, "headers"> {
  headers?: CustomHeadersInit;
  timeout?: number;
  skipErrorHandling?: boolean;
  skipTokenRefresh?: boolean;
  skipTokenCheck?: boolean;
}

export async function httpClient<T = any>(
  url: string,
  options: HttpClientOptions = {}
): Promise<T> {
  // Extraer opciones personalizadas
  const {
    timeout = REQUEST_TIMEOUT,
    skipErrorHandling = false,
    skipTokenRefresh = false,
    skipTokenCheck = false,
    ...fetchOptions
  } = options;

  // Obtener la sesión actual
  const session = await getCachedSession();
  let accessToken = session?.accessToken as string | undefined;

  // Verificar y renovar el token si es necesario
  if (accessToken && !skipTokenRefresh && !skipTokenCheck) {
    try {
      accessToken = await checkAndRefreshToken(accessToken);
    } catch (error) {
      // Si no se puede renovar el token, continuar con el actual
      console.warn(
        "No se pudo renovar el token, continuando con el actual:",
        error
      );
    }
  }

  // Crear los headers básicos
  const baseHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Añadir token de autorización si existe
  if (accessToken) {
    baseHeaders["Authorization"] = `Bearer ${accessToken}`;
  }

  // Añadir token CSRF para métodos que modifican datos
  const method = (fetchOptions.method || "GET").toUpperCase();
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      baseHeaders["X-CSRF-Token"] = csrfToken;
    }
  }

  // Combinar headers base con headers personalizados
  const mergedHeaders: Record<string, string> = {
    ...baseHeaders,
  };

  // Añadir headers personalizados (si existen)
  if (fetchOptions.headers) {
    Object.entries(fetchOptions.headers).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        mergedHeaders[key] = value;
      }
    });
  }

  // Construir URL completa
  const fullUrl = url.startsWith("http")
    ? url
    : `${API_BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;

  // Implementar timeout con AbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    // Log de depuración
    if (process.env.NODE_ENV === "development") {
      console.log(`[httpClient] Enviando ${method} a ${fullUrl}`);
      console.log("[httpClient] Headers:", mergedHeaders);
      console.log(
        "[httpClient] Body:",
        fetchOptions.body ? "Existe body" : "Sin body"
      );
    }

    // Crear opciones para fetch - eliminando la duplicación de headers
    const requestOptions: RequestInit = {
      ...fetchOptions,
      method,
      headers: mergedHeaders,
      credentials: "include",
      signal: controller.signal,
    };

    const response = await fetch(fullUrl, requestOptions);

    // Limpiar el timeout
    clearTimeout(timeoutId);

    // Manejar respuestas no exitosas
    if (!response.ok) {
      const statusCode = response.status;
      let errorData = null;

      try {
        // Intentar parsear el cuerpo como JSON
        errorData = await response.json();
      } catch (e) {
        // Si no es JSON, usar el texto de la respuesta
        errorData = { message: await response.text() };
      }

      // Manejar caso específico de sesión expirada
      if (statusCode === 401) {
        const error = await handleExpiredSession(statusCode, errorData);

        if (!skipErrorHandling) {
          logError(error);
        }

        throw error;
      }

      // Crear error personalizado para otras respuestas no exitosas
      const error = createAppError(
        ErrorType.API_REQUEST_FAILED,
        errorData?.message || `Error ${statusCode}: ${response.statusText}`,
        statusCode,
        errorData
      );

      if (!skipErrorHandling) {
        logError(error);
      }

      throw error;
    }

    // Para respuestas 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    // Verificar el tipo de contenido para determinar cómo procesar la respuesta
    const contentType = response.headers.get("content-type");
    if (!contentType || contentType.includes("application/json")) {
      try {
        return (await response.json()) as T;
      } catch (e) {
        if (contentType && contentType.includes("application/json")) {
          console.warn(
            "Error al parsear JSON aunque el Content-Type es application/json",
            e
          );
        }
        return {} as T;
      }
    } else if (contentType.includes("text/")) {
      // Manejar respuestas de texto
      const text = await response.text();
      try {
        // Intentar parsear como JSON por si acaso
        return JSON.parse(text) as T;
      } catch {
        // Si no es JSON, devolver el texto como es
        return text as unknown as T;
      }
    } else {
      // Para otros tipos, como binarios
      return response as unknown as T;
    }
  } catch (error: unknown) {
    // Limpiar el timeout
    clearTimeout(timeoutId);

    // Si fue un timeout (AbortError)
    if (error instanceof Error && error.name === "AbortError") {
      const timeoutError = createAppError(
        ErrorType.API_TIMEOUT,
        `La solicitud a ${url} excedió el tiempo límite de ${timeout}ms`,
        408
      );

      if (!skipErrorHandling) {
        logError(timeoutError);
      }

      throw timeoutError;
    }

    // Si ya es un AppError (creado anteriormente), propagarlo
    if (typeof error === "object" && error !== null && "type" in error) {
      throw error;
    }

    // Otros errores (red, etc.)
    const networkError = createAppError(
      ErrorType.API_NETWORK_ERROR,
      `Error de red en solicitud a ${url}: ${
        error instanceof Error ? error.message : "Error desconocido"
      }`,
      undefined,
      error
    );

    if (!skipErrorHandling) {
      logError(networkError);
    }

    throw networkError;
  }
}
