import { getSession } from "next-auth/react";

export async function httpClient<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  // Obtener la sesión de NextAuth para extraer el accessToken
  const session = await getSession();
  console.log("Sesión:", session);
  const accessToken = session?.accessToken;
  console.log("accessToken:", accessToken);

  // Configurar las opciones por defecto, agregando el header Authorization si existe el token
  const defaultOptions: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    credentials: "include",
  };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const fullUrl = `${apiUrl}${url}`;

  console.log(`Enviando petición a: ${fullUrl}`);
  console.log("Opciones:", JSON.stringify(defaultOptions));

  try {
    const response = await fetch(fullUrl, {
      ...defaultOptions,
      ...options,
    });

    console.log(`Respuesta recibida de ${fullUrl}:`, response.status);
    console.log(
      "Headers:",
      Object.fromEntries([...response.headers.entries()])
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response body:", errorText);

      let errorMessage;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage =
          errorJson.message ||
          errorJson.error ||
          `Error ${response.status}: ${response.statusText}`;
      } catch (e) {
        errorMessage =
          errorText || `Error ${response.status}: ${response.statusText}`;
      }

      throw new Error(errorMessage);
    }

    // Para respuestas 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  } catch (error) {
    console.error(`Error en petición a ${fullUrl}:`, error);
    throw error;
  }
}
