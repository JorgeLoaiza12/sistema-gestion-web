// auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { decodeJWT } from "@/lib/tokenService"; // Asegúrate que esta función exista y funcione correctamente

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET as string,
  session: {
    strategy: "jwt",
    // maxAge: 24 * 60 * 60, // 24 horas para la sesión de NextAuth
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
          if (!credentials?.email || !credentials?.password) {
            console.log("[Authorize] Email o contraseña faltantes.");
            return null;
          }

          const apiUrl = process.env.NEXT_PUBLIC_API_URL as string;
          if (!apiUrl) {
            console.error("[Authorize] NEXT_PUBLIC_API_URL no está definida.");
            return null;
          }

          console.log(
            `[Authorize] Attempting login for ${credentials.email} at ${apiUrl}/auth/login`
          );
          const response = await fetch(`${apiUrl}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            console.log(
              `[Authorize] Login failed. Status: ${response.status}`,
              errorData
            );
            return null;
          }

          const data = await response.json();
          console.log("[Authorize] Login successful. Data received:", data);

          if (data.token && data.user) {
            return {
              id: data.user.id.toString(),
              email: credentials.email as string,
              name: data.user.name || "Usuario",
              role: data.user.role || "WORKER",
              token: data.token, // Este es el accessToken del backend
            };
          }
          console.log(
            "[Authorize] Token o usuario faltante en la respuesta del backend."
          );
          return null;
        } catch (error) {
          console.error("[Authorize] Exception during authorization:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      const now = Date.now();

      if (user) {
        // Proceso de inicio de sesión inicial
        console.log("[JWT Callback] Initial sign-in. User:", user);
        token.id = user.id as string;
        token.email = user.email as string;
        token.name = user.name as string;
        token.role = (user.role as string) || "WORKER";
        token.image = user.image || null;
        token.accessToken = user.token as string; // Token de acceso del backend

        const backendTokenPayload = decodeJWT(token.accessToken as string);
        if (backendTokenPayload && backendTokenPayload.exp) {
          token.backendTokenExpiresAt = backendTokenPayload.exp * 1000; // en milisegundos
          console.log(
            "[JWT Callback] Backend token expiration set to:",
            new Date(token.backendTokenExpiresAt).toISOString()
          );
        } else {
          // Si no se puede decodificar o no tiene exp, asumir que expira en 1 hora (según tu backend)
          token.backendTokenExpiresAt = now + 60 * 60 * 1000;
          console.warn(
            "[JWT Callback] Backend token 'exp' not found, assuming 1 hour expiration:",
            new Date(token.backendTokenExpiresAt).toISOString()
          );
        }
        // Establecer la expiración del JWT de NextAuth (ej. 24 horas)
        token.exp = Math.floor(now / 1000) + 24 * 60 * 60;
        console.log(
          "[JWT Callback] NextAuth token expiration set to:",
          new Date((token.exp as number) * 1000).toISOString()
        );
        token.error = undefined;
      }

      if (trigger === "update" && session) {
        // Si la sesión se actualiza externamente (ej. cambio de nombre)
        console.log(
          "[JWT Callback] Session update triggered. New session data:",
          session
        );
        if (session.user?.name) token.name = session.user.name;
        if (session.user?.image) token.image = session.user.image;
        if (session.accessToken) {
          // Si la actualización incluye un nuevo accessToken
          token.accessToken = session.accessToken;
          const backendTokenPayload = decodeJWT(token.accessToken as string);
          if (backendTokenPayload && backendTokenPayload.exp) {
            token.backendTokenExpiresAt = backendTokenPayload.exp * 1000;
          }
        }
      }

      // Lógica de Refresco del Token del Backend
      // Refrescar si el token del backend está a punto de expirar (ej. < 5 minutos) o ya expiró
      const fiveMinutesInMs = 5 * 60 * 1000;
      if (
        token.accessToken &&
        token.backendTokenExpiresAt &&
        token.backendTokenExpiresAt - now < fiveMinutesInMs
      ) {
        console.log(
          `[JWT Callback] Backend access token expiring soon (expires at ${new Date(
            token.backendTokenExpiresAt
          ).toISOString()}) or expired. Attempting refresh.`
        );
        try {
          // NEXTAUTH_URL es crucial para llamadas fetch internas en el mismo origen en Vercel/entornos serverless
          const nextAuthUrl =
            process.env.NEXTAUTH_URL ||
            process.env.VERCEL_URL ||
            "http://localhost:3001";
          const refreshApiUrl = new URL(
            "/api/auth/refresh",
            nextAuthUrl.startsWith("http")
              ? nextAuthUrl
              : `http://${nextAuthUrl}`
          ).toString();

          console.log(`[JWT Callback] Calling refresh API: ${refreshApiUrl}`);
          const refreshResponse = await fetch(refreshApiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            // El token actual de NextAuth (que contiene el accessToken del backend) se envía implícitamente
            // a través de las cookies, ya que /api/auth/refresh usa getToken().
          });

          if (refreshResponse.ok) {
            const refreshedData = await refreshResponse.json();
            if (refreshedData.accessToken) {
              token.accessToken = refreshedData.accessToken;
              const newBackendTokenPayload = decodeJWT(
                token.accessToken as string
              );
              if (newBackendTokenPayload && newBackendTokenPayload.exp) {
                token.backendTokenExpiresAt = newBackendTokenPayload.exp * 1000;
                console.log(
                  "[JWT Callback] Backend token refreshed. New backend expiration:",
                  new Date(token.backendTokenExpiresAt).toISOString()
                );
              } else {
                token.backendTokenExpiresAt = now + 60 * 60 * 1000; // Asumir 1h
                console.warn(
                  "[JWT Callback] Refreshed backend token 'exp' not found, assuming 1 hour expiration:",
                  new Date(token.backendTokenExpiresAt).toISOString()
                );
              }
              // Actualizar la expiración del token de NextAuth con lo que devuelve /api/auth/refresh
              token.exp =
                refreshedData.exp || Math.floor(now / 1000) + 24 * 60 * 60;
              token.error = undefined;
              console.log(
                "[JWT Callback] NextAuth token expiration updated after refresh:",
                new Date((token.exp as number) * 1000).toISOString()
              );
            } else {
              console.warn(
                "[JWT Callback] Token refresh API call was ok but did not return new accessToken."
              );
              token.error = "RefreshFailed";
              // Si el refresco falla y el token del backend ya expiró, expirar la sesión de NextAuth.
              if (
                token.backendTokenExpiresAt &&
                now >= token.backendTokenExpiresAt
              ) {
                console.log(
                  "[JWT Callback] Backend token expired after failed refresh (no new token). Expiring NextAuth session."
                );
                token.exp = 0; // Expirar inmediatamente
              }
            }
          } else {
            const errorData = await refreshResponse
              .json()
              .catch(() => ({
                message: "Error al decodificar respuesta de error de refresco",
              }));
            console.error(
              `[JWT Callback] Token refresh API call failed. Status: ${refreshResponse.status}`,
              errorData
            );
            token.error = "RefreshFailed";
            if (
              token.backendTokenExpiresAt &&
              now >= token.backendTokenExpiresAt
            ) {
              console.log(
                "[JWT Callback] Backend token expired after failed refresh (API error). Expiring NextAuth session."
              );
              token.exp = 0; // Expirar inmediatamente
            }
          }
        } catch (error) {
          console.error(
            "[JWT Callback] Exception during token refresh request:",
            error
          );
          token.error = "RefreshFailed";
          if (
            token.backendTokenExpiresAt &&
            now >= token.backendTokenExpiresAt
          ) {
            console.log(
              "[JWT Callback] Backend token expired after refresh exception. Expiring NextAuth session."
            );
            token.exp = 0; // Expirar inmediatamente
          }
        }
      }

      // Verificar si el token de NextAuth (sesión principal) ha expirado
      // Esto es un último recurso si el refresco del token del backend falla y la sesión de NextAuth también caduca.
      if (token.exp && now >= (token.exp as number) * 1000) {
        console.log(
          `[JWT Callback] NextAuth JWT has expired (exp: ${new Date(
            (token.exp as number) * 1000
          ).toISOString()}, now: ${new Date(
            now
          ).toISOString()}). Forcing logout.`
        );
        delete token.accessToken;
        delete token.backendTokenExpiresAt;
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

      if (token.error) {
        // @ts-ignore
        session.error = token.error;
        console.log(
          "[Session Callback] Session error propagated:",
          token.error
        );
      }

      // Si token.exp es 0, NextAuth tratará la sesión como expirada.
      // session.expires se establece automáticamente por NextAuth basado en token.exp.
      // console.log("[Session Callback] Final session object:", session);
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
