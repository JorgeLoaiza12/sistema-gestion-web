// app/api/auth/refresh/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function POST(req: NextRequest) {
  try {
    // Obtener el token actual de las cookies
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // Verificar si hay un token y si tiene accessToken
    if (!token || !token.accessToken) {
      console.log("No hay token válido para renovar");
      return NextResponse.json(
        { error: "No hay token válido para renovar" },
        { status: 401 }
      );
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    try {
      const response = await fetch(`${apiUrl}/auth/refresh-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token.accessToken}`,
        },
        body: JSON.stringify({ userId: token.id }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Error ${response.status}: ${response.statusText}`
        );
      }

      // Obtener el nuevo token
      const data = await response.json();

      // Devolver el nuevo token para que next-auth lo actualice
      return NextResponse.json({
        accessToken: data.token,
        exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 horas
      });
    } catch (error) {
      console.error("Error al renovar token en el servidor:", error);
      return NextResponse.json(
        { error: "Error en la comunicación con el servidor de autenticación" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error interno al renovar el token:", error);
    return NextResponse.json(
      { error: "Error interno en el proceso de renovación" },
      { status: 500 }
    );
  }
}
