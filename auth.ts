// auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { decodeJWT } from "@/lib/tokenService";

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET as string,
  session: {
    strategy: "jwt",
    // maxAge: 24 * 60 * 60, // NextAuth JWT maxAge, el token del backend tiene su propia duración
  },
  providers: [
    Credentials({
      id: "credentials",
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials, req) {
        try {
          if (!credentials?.email || !credentials?.password) return null;

          const apiUrl = process.env.NEXT_PUBLIC_API_URL as string;
          const response = await fetch(`${apiUrl}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          const data = await response.json();
          // console.log("Auth response:", data); // Considera remover en producción

          if (response.ok && data.token && data.user) {
            return {
              id: data.user.id.toString(), // Asegurar que id sea string
              email: credentials.email as string,
              name: data.user.name || "Usuario",
              role: data.user.role || "WORKER",
              token: data.token, // Este es el accessToken del backend
            };
          }
          return null;
        } catch (error) {
          console.error("Auth error in authorize callback:", error);
          return null;
        }
      },
    }),
    // El proveedor "refresh" se usa internamente si se llama a signIn("refresh")
    // pero la lógica principal de refresco estará en el callback jwt.
    // Esta ruta /api/auth/refresh es la que llama el callback jwt.
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      const now = Date.now();

      if (user) {
        // Initial sign-in
        token.id = user.id as string;
        token.email = user.email as string;
        token.name = user.name as string;
        token.role = (user.role as string) || "WORKER";
        token.image = user.image || null;
        token.accessToken = user.token as string; // Backend access token

        // Decodificar el accessToken del backend para obtener su 'exp'
        const backendTokenPayload = decodeJWT(token.accessToken as string);
        if (backendTokenPayload && backendTokenPayload.exp) {
          // Almacenar la expiración del token del backend en milisegundos
          token.backendTokenExpiresAt = backendTokenPayload.exp * 1000;
        } else {
          // Si no se puede decodificar o no tiene exp, asumir que expira en 1 hora (según tu backend)
          token.backendTokenExpiresAt = now + 60 * 60 * 1000;
        }
        // Establecer la expiración del JWT de NextAuth (ej. 24 horas)
        token.exp = Math.floor(now / 1000) + 24 * 60 * 60;
        token.error = undefined; // Limpiar errores previos
      }

      // Si la sesión se actualiza externamente (ej. cambio de nombre)
      if (trigger === "update" && session) {
        if (session.user?.name) token.name = session.user.name;
        if (session.user?.image) token.image = session.user.image;
        // Si la actualización de sesión incluye un nuevo accessToken (improbable aquí pero por completitud)
        if (session.accessToken) {
          token.accessToken = session.accessToken;
          const backendTokenPayload = decodeJWT(token.accessToken as string);
          if (backendTokenPayload && backendTokenPayload.exp) {
            token.backendTokenExpiresAt = backendTokenPayload.exp * 1000;
          }
        }
      }

      // Lógica de Refresco del Token del Backend
      // Refrescar si el token del backend está a punto de expirar (ej. < 5 minutos)
      const fiveMinutesInMs = 5 * 60 * 1000;
      if (
        token.accessToken &&
        token.backendTokenExpiresAt &&
        token.backendTokenExpiresAt - now < fiveMinutesInMs
      ) {
        console.log(
          "[AUTH.TS JWT CALLBACK] Backend access token expiring soon or expired. Attempting refresh."
        );
        try {
          // Llamar a la ruta API interna de Next.js para refrescar
          const refreshResponse = await fetch(
            `${process.env.NEXTAUTH_URL}/api/auth/refresh`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                // El token actual (de NextAuth) se envía implícitamente a través de las cookies
                // ya que /api/auth/refresh usa getToken() que lee las cookies.
              },
            }
          );

          if (refreshResponse.ok) {
            const refreshedData = await refreshResponse.json();
            if (refreshedData.accessToken) {
              token.accessToken = refreshedData.accessToken;
              const newBackendTokenPayload = decodeJWT(
                token.accessToken as string
              );
              if (newBackendTokenPayload && newBackendTokenPayload.exp) {
                token.backendTokenExpiresAt = newBackendTokenPayload.exp * 1000;
              } else {
                token.backendTokenExpiresAt = now + 60 * 60 * 1000; // Asumir 1h si no hay exp
              }
              // La ruta /api/auth/refresh también debe devolver una nueva 'exp' para el token de NextAuth
              token.exp =
                refreshedData.exp || Math.floor(now / 1000) + 24 * 60 * 60;
              token.error = undefined; // Limpiar cualquier error de refresco previo
              console.log(
                "[AUTH.TS JWT CALLBACK] Backend access token refreshed successfully."
              );
            } else {
              console.warn(
                "[AUTH.TS JWT CALLBACK] Token refresh API call was ok but did not return new accessToken."
              );
              token.error = "RefreshFailed";
            }
          } else {
            const errorData = await refreshResponse.json().catch(() => ({
              message: "Refresh failed with status " + refreshResponse.status,
            }));
            console.error(
              "[AUTH.TS JWT CALLBACK] Token refresh failed. Status:",
              refreshResponse.status,
              "Data:",
              errorData
            );
            token.error = "RefreshFailed";
            // Si el refresco falla y el token del backend ya expiró, forzar la expiración del token de NextAuth
            if (
              token.backendTokenExpiresAt &&
              now >= token.backendTokenExpiresAt
            ) {
              console.log(
                "[AUTH.TS JWT CALLBACK] Backend token is definitively expired after failed refresh."
              );
              token.exp = 0; // Expirar inmediatamente el token de NextAuth
            }
          }
        } catch (error) {
          console.error(
            "[AUTH.TS JWT CALLBACK] Error during token refresh:",
            error
          );
          token.error = "RefreshFailed";
          if (
            token.backendTokenExpiresAt &&
            now >= token.backendTokenExpiresAt
          ) {
            console.log(
              "[AUTH.TS JWT CALLBACK] Backend token is definitively expired after refresh exception."
            );
            token.exp = 0; // Expirar inmediatamente el token de NextAuth
          }
        }
      }

      // Verificar si el token de NextAuth (sesión principal) ha expirado
      // Esto es un último recurso si el refresco del token del backend falla y la sesión de NextAuth también caduca.
      if (token.exp && now >= (token.exp as number) * 1000) {
        console.log(
          "[AUTH.TS JWT CALLBACK] NextAuth JWT has expired. Forcing logout."
        );
        // Limpiar los tokens para evitar usar datos obsoletos
        delete token.accessToken;
        delete token.backendTokenExpiresAt;
        // Establecer el error para que la sesión lo refleje
        token.error = "TokenExpired"; // Error estándar de NextAuth para sesión expirada
        return { ...token, exp: 0 }; // Indicar a NextAuth que la sesión ha terminado
      }

      return token;
    },
    async session({ session, token }) {
      // Pasar datos del token a la sesión del cliente
      session.user.id = token.id as string;
      session.user.email = token.email as string;
      session.user.name = token.name as string;
      session.user.role = token.role as string;
      session.user.image = (token.image as string) || null;
      session.accessToken = token.accessToken as string; // Este es el token del backend

      // Si hubo un error durante el proceso del token JWT (ej. fallo de refresco),
      // se puede pasar a la sesión para que el cliente reaccione.
      if (token.error) {
        // @ts-ignore // Se puede extender el tipo Session si se desea tipar formalmente session.error
        session.error = token.error;
      }

      // Si el token.exp es 0 o ya pasó, la sesión se considerará inválida por NextAuth
      // y se requerirá un nuevo inicio de sesión.
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login", // Errores de autenticación redirigen a login
    signOut: "/login",
  },
  debug: process.env.NODE_ENV === "development",
});
