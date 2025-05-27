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
      console.log(
        `[JWT CALLBACK ENTRY] Trigger: ${trigger}, Now: ${new Date(
          now
        ).toISOString()}`
      );
      if (token) {
        console.log(
          `[JWT CALLBACK ENTRY] Existing token: exp=<span class="math-inline">\{token\.exp ? new Date\(\(token\.exp as number\) \* 1000\)\.toISOString\(\) \: 'N/A'\}, backendExp\=</span>{token.backendTokenExpiresAt ? new Date(token.backendTokenExpiresAt).toISOString() : 'N/A'}, error=${token.error}`
        );
      }
      if (user) {
        console.log("[JWT CALLBACK] Initial sign-in. User ID:", user.id);
        // ... (lógica de inicio de sesión) ...
        token.accessToken = user.token as string;
        const backendTokenPayload = decodeJWT(token.accessToken as string);
        if (backendTokenPayload && backendTokenPayload.exp) {
          token.backendTokenExpiresAt = backendTokenPayload.exp * 1000;
          console.log(
            "[JWT CALLBACK] Backend token expiration INITIALIZED to:",
            new Date(token.backendTokenExpiresAt).toISOString()
          );
        } else {
          token.backendTokenExpiresAt = now + 60 * 60 * 1000; // Asumir 1h
          console.warn(
            "[JWT CALLBACK] Backend token 'exp' not found on init, assuming 1 hour:",
            new Date(token.backendTokenExpiresAt).toISOString()
          );
        }
        token.exp = Math.floor(now / 1000) + 24 * 60 * 60; // NextAuth token 24h
        console.log(
          "[JWT CALLBACK] NextAuth token expiration INITIALIZED to:",
          new Date((token.exp as number) * 1000).toISOString()
        );
      }

      const fiveMinutesInMs = 5 * 60 * 1000;
      const shouldAttemptRefresh =
        token.accessToken &&
        token.backendTokenExpiresAt &&
        token.backendTokenExpiresAt - now < fiveMinutesInMs;

      if (shouldAttemptRefresh) {
        console.log(
          `[JWT CALLBACK] Backend token needs refresh. BackendExp: ${new Date(
            token.backendTokenExpiresAt!
          ).toISOString()}, Now: ${new Date(
            now
          ).toISOString()}. Attempting refresh.`
        );
        try {
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
          console.log(
            `[JWT CALLBACK] Calling internal refresh API: ${refreshApiUrl}`
          );

          const refreshResponse = await fetch(refreshApiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
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
              } else {
                token.backendTokenExpiresAt = now + 60 * 60 * 1000; // Asumir 1h
              }
              token.exp =
                refreshedData.exp || Math.floor(now / 1000) + 24 * 60 * 60;
              token.error = undefined;
              console.log(
                `[JWT CALLBACK] SUCCESSFUL REFRESH. New BackendExp: ${new Date(
                  token.backendTokenExpiresAt
                ).toISOString()}, New NextAuthExp: ${new Date(
                  (token.exp as number) * 1000
                ).toISOString()}`
              );
            } else {
              console.warn(
                "[JWT CALLBACK] Refresh API OK, but no new accessToken returned."
              );
              token.error = "RefreshFailed";
              console.log(
                "[JWT CALLBACK] Setting NextAuth token exp to 0 due to missing new accessToken."
              );
              token.exp = 0; // Forzar expiración de NextAuth
              delete token.accessToken;
              delete token.backendTokenExpiresAt;
            }
          } else {
            // refreshResponse NOT OK
            const errorData = await refreshResponse
              .json()
              .catch(() => ({
                message: "Error decodificando respuesta de error de refresco",
              }));
            console.error(
              `[JWT CALLBACK] Refresh API call FAILED. Status: ${refreshResponse.status}`,
              errorData
            );
            token.error = "RefreshFailed";
            console.log(
              "[JWT CALLBACK] Setting NextAuth token exp to 0 due to API refresh failure."
            );
            token.exp = 0; // Forzar expiración de NextAuth
            delete token.accessToken;
            delete token.backendTokenExpiresAt;
          }
        } catch (error) {
          console.error(
            "[JWT CALLBACK] EXCEPTION during token refresh request:",
            error
          );
          token.error = "RefreshFailed";
          console.log(
            "[JWT CALLBACK] Setting NextAuth token exp to 0 due to refresh exception."
          );
          token.exp = 0; // Forzar expiración de NextAuth
          delete token.accessToken;
          delete token.backendTokenExpiresAt;
        }
      }

      // Final check for NextAuth token expiration
      if (token.exp && now >= (token.exp as number) * 1000) {
        console.log(
          `[JWT CALLBACK] NextAuth JWT is EXPIRED (exp: ${new Date(
            (token.exp as number) * 1000
          ).toISOString()}). Invalidating.`
        );
        delete token.accessToken; // Asegurarse de limpiar tokens
        delete token.backendTokenExpiresAt;
        return { ...token, exp: 0 }; // Devolver token expirado para NextAuth
      }
      console.log(
        `[JWT CALLBACK EXIT] Returning token: exp=<span class="math-inline">\{token\.exp ? new Date\(\(token\.exp as number\) \* 1000\)\.toISOString\(\) \: 'N/A'\}, backendExp\=</span>{token.backendTokenExpiresAt ? new Date(token.backendTokenExpiresAt).toISOString() : 'N/A'}, error=${token.error}`
      );
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
