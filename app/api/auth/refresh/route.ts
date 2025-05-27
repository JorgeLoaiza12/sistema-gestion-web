// app/api/auth/refresh/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
      // Asegúrate de que las cookies seguras se manejen correctamente en producción
      secureCookie: process.env.NODE_ENV === "production",
    });

    if (!token || !token.accessToken) {
      console.log("[Refresh API] No valid token found in session to refresh.");
      return NextResponse.json(
        { error: "No hay token válido para renovar" },
        { status: 401 }
      );
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      console.error("[Refresh API] NEXT_PUBLIC_API_URL is not defined.");
      return NextResponse.json(
        { error: "Configuración de API incorrecta" },
        { status: 500 }
      );
    }

    console.log(
      `[Refresh API] Attempting to refresh token for user ID: ${token.id} via backend: ${apiUrl}/auth/refresh-token`
    );
    const response = await fetch(`${apiUrl}/auth/refresh-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token.accessToken}`, // Enviar el token de acceso actual del backend
      },
      // El backend puede inferir el usuario desde el token.accessToken
      // o si es necesario, puedes enviar token.id en el body:
      // body: JSON.stringify({ userId: token.id }),
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({
          message: "Error al decodificar respuesta del backend",
        }));
      console.error(
        `[Refresh API] Backend refresh failed. Status: ${response.status}`,
        errorData
      );
      // Si el backend devuelve 401 o 403, podría significar que el token original ya no es válido en absoluto.
      return NextResponse.json(
        {
          error:
            errorData.message || `Error del backend: ${response.statusText}`,
        },
        { status: response.status } // Propagar el código de estado del backend
      );
    }

    const data = await response.json();
    if (!data.token) {
      console.error(
        "[Refresh API] Backend refresh successful but new token is missing in response.",
        data
      );
      return NextResponse.json(
        { error: "Respuesta de refresco inválida del backend" },
        { status: 500 }
      );
    }
    console.log(
      "[Refresh API] Backend refresh successful. New token received."
    );

    // Calcular la nueva expiración para el token de NextAuth (ej: 24 horas desde ahora)
    const newNextAuthTokenExp = Math.floor(Date.now() / 1000) + 24 * 60 * 60;

    return NextResponse.json({
      accessToken: data.token, // El nuevo token del backend
      exp: newNextAuthTokenExp, // Nueva expiración para el JWT de NextAuth (en segundos)
    });
  } catch (error: any) {
    console.error(
      "[Refresh API] Error during token refresh process:",
      error.message,
      error.stack
    );
    return NextResponse.json(
      { error: error.message || "Error interno en el proceso de renovación" },
      { status: 500 }
    );
  }
}
