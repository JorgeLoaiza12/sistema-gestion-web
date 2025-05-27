// app/api/auth/refresh/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// Define una constante para el timeout de la llamada al backend.
// Ajústalo para que sea menor que el timeout de tu función Lambda de Vercel.
// Por ejemplo, si tu lambda tiene un timeout de 10s, ponlo a 9s. Si es 15s, ponlo a 13-14s.
const BACKEND_FETCH_TIMEOUT_MS = 9000; // 9 segundos por defecto

export async function POST(req: NextRequest) {
  const requestStartTime = Date.now();
  console.log(
    `[Refresh API /api/auth/refresh] Received request at ${new Date(
      requestStartTime
    ).toISOString()}.`
  );

  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
      // Asegúrate de que las cookies seguras se manejen correctamente en producción
      secureCookie: process.env.NODE_ENV === "production",
    });

    if (!token || !token.accessToken) {
      const msg =
        "[Refresh API] No valid current token found in session to refresh (missing token or accessToken).";
      console.warn(msg);
      const functionDuration = Date.now() - requestStartTime;
      console.log(
        `[Refresh API] Total execution time before error: ${functionDuration}ms.`
      );
      return NextResponse.json(
        { error: "No hay token válido para renovar" },
        { status: 401 }
      );
    }
    console.log(
      `[Refresh API] Current session token ID: ${
        token.id
      }, backend accessToken (first 10 chars): ${String(
        token.accessToken
      ).substring(0, 10)}...`
    );

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      const msg =
        "[Refresh API] FATAL: NEXT_PUBLIC_API_URL is not defined in environment variables.";
      console.error(msg);
      const functionDuration = Date.now() - requestStartTime;
      console.log(
        `[Refresh API] Total execution time before error: ${functionDuration}ms.`
      );
      return NextResponse.json(
        { error: "Configuración de API del servidor incorrecta" },
        { status: 500 }
      );
    }

    const backendRefreshUrl = `${apiUrl}/auth/refresh-token`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn(
        `[Refresh API] Backend fetch to ${backendRefreshUrl} ABORTED due to internal timeout (${BACKEND_FETCH_TIMEOUT_MS}ms).`
      );
      controller.abort();
    }, BACKEND_FETCH_TIMEOUT_MS);

    const backendCallStartTime = Date.now();
    console.log(
      `[Refresh API] Calling backend refresh endpoint: ${backendRefreshUrl} at ${new Date(
        backendCallStartTime
      ).toISOString()} for user ID: ${token.id}`
    );

    let response: Response | undefined;
    try {
      response = await fetch(backendRefreshUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token.accessToken}`, // Enviar el token de acceso actual del backend
        },
        signal: controller.signal, // Importante para el AbortController
        // Si tu backend espera userId en el body (no recomendado si el token ya lo infiere):
        // body: JSON.stringify({ userId: token.id }),
      });
    } catch (fetchError: any) {
      // Este catch se activa si hay un error de red fundamental antes de obtener una respuesta,
      // o si el fetch es abortado y la promesa es rechazada.
      clearTimeout(timeoutId); // Siempre limpiar el timeout
      const backendCallDurationOnError = Date.now() - backendCallStartTime;
      if (controller.signal.aborted) {
        // Si fue abortado por nuestro timeout programado
        console.warn(
          `[Refresh API] Fetch to ${backendRefreshUrl} was aborted by internal timeout. Duration: ${backendCallDurationOnError}ms.`
        );
        // El log del timeoutId ya se habrá disparado.
      } else {
        console.error(
          `[Refresh API] Network or other unhandled error during fetch to ${backendRefreshUrl}. Duration: ${backendCallDurationOnError}ms. Error: ${fetchError.message}`,
          fetchError
        );
      }
      const functionDuration = Date.now() - requestStartTime;
      console.log(
        `[Refresh API] Total execution time before error: ${functionDuration}ms.`
      );
      // Devolver un error genérico de gateway o servicio no disponible
      return NextResponse.json(
        {
          error:
            "Error de comunicación al intentar renovar con el servidor backend",
        },
        { status: 502 }
      ); // Bad Gateway
    }

    clearTimeout(timeoutId); // Limpiar el timeout si el fetch completó (incluso si no fue OK)
    const backendCallDuration = Date.now() - backendCallStartTime;

    if (controller.signal.aborted && !response) {
      // Si fue abortado Y no tenemos respuesta (el catch anterior debería haberlo manejado, pero por si acaso)
      console.warn(
        `[Refresh API] Fetch to ${backendRefreshUrl} was aborted (signal check). Duration: ${backendCallDuration}ms.`
      );
      const functionDuration = Date.now() - requestStartTime;
      console.log(
        `[Refresh API] Total execution time before error: ${functionDuration}ms.`
      );
      return NextResponse.json(
        {
          error:
            "Timeout (controlado) al contactar el servicio de renovación del backend",
        },
        { status: 504 }
      );
    }

    if (!response) {
      // Si response es undefined por alguna razón no capturada antes
      console.error(
        `[Refresh API] Response from backend is undefined after fetch. Duration: ${backendCallDuration}ms.`
      );
      const functionDuration = Date.now() - requestStartTime;
      console.log(
        `[Refresh API] Total execution time before error: ${functionDuration}ms.`
      );
      return NextResponse.json(
        { error: "Respuesta inesperada del servidor backend al renovar token" },
        { status: 500 }
      );
    }

    console.log(
      `[Refresh API] Backend call to ${backendRefreshUrl} completed. Status: ${response.status}. Duration: ${backendCallDuration}ms.`
    );

    if (!response.ok) {
      let errorData = { message: `Error del backend: ${response.statusText}` };
      try {
        errorData = await response.json();
      } catch (e) {
        console.warn(
          `[Refresh API] Could not parse JSON error response from backend. Status: ${response.status}`
        );
      }
      console.error(
        `[Refresh API] Backend refresh call FAILED. Status: ${response.status}. Response:`,
        errorData
      );
      const functionDuration = Date.now() - requestStartTime;
      console.log(
        `[Refresh API] Total execution time before error: ${functionDuration}ms.`
      );
      return NextResponse.json(
        {
          error:
            errorData.message ||
            `Error del backend al refrescar: ${response.statusText}`,
        },
        { status: response.status } // Propagar el código de estado del backend
      );
    }

    const data = await response.json();
    if (!data.token) {
      const msg =
        "[Refresh API] Backend refresh successful BUT new token is missing in response.";
      console.error(msg, data);
      const functionDuration = Date.now() - requestStartTime;
      console.log(
        `[Refresh API] Total execution time before error: ${functionDuration}ms.`
      );
      return NextResponse.json(
        {
          error: "Respuesta de refresco inválida del backend (sin token nuevo)",
        },
        { status: 500 }
      );
    }
    console.log(
      `[Refresh API] Backend refresh successful. New backend accessToken (first 10 chars): ${String(
        data.token
      ).substring(0, 10)}...`
    );

    // Calcular la nueva expiración para el token de NextAuth (ej: 24 horas desde ahora)
    const newNextAuthTokenExp = Math.floor(Date.now() / 1000) + 24 * 60 * 60; // en segundos
    console.log(
      `[Refresh API] New NextAuth token expiration set to: ${new Date(
        newNextAuthTokenExp * 1000
      ).toISOString()}`
    );

    const functionDuration = Date.now() - requestStartTime;
    console.log(`[Refresh API] Total execution time: ${functionDuration}ms.`);
    return NextResponse.json({
      accessToken: data.token, // El nuevo token del backend
      exp: newNextAuthTokenExp, // Nueva expiración para el JWT de NextAuth (en segundos)
    });
  } catch (error: any) {
    // Este catch es para errores inesperados en el flujo de la función POST en sí,
    // no necesariamente errores de fetch que ya deberían ser manejados.
    console.error(
      "[Refresh API] UNHANDLED EXCEPTION in POST /api/auth/refresh:",
      error.message,
      error.stack
    );
    const functionDuration = Date.now() - requestStartTime;
    console.log(
      `[Refresh API] Total execution time before error: ${functionDuration}ms.`
    );
    return NextResponse.json(
      {
        error:
          error.message ||
          "Error interno grave en el proceso de renovación de token",
      },
      { status: 500 }
    );
  }
}
