// auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { signInSchema } from "./lib/zod";

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET as string,
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 horas (en segundos)
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
          console.log("Auth response:", data);

          if (response.ok && data.token) {
            // Ajustar la estructura de retorno para cumplir con el tipo User
            return {
              id: data.user?.id || "1",
              email: credentials.email as string,
              name: data.user?.name || "Usuario",
              role: data.user?.role || "WORKER",
              image: data.user?.avatarUrl || null,
              token: data.token,
            };
          }
          return null;
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
    // Proveedor para renovación de token
    Credentials({
      id: "refresh",
      credentials: {},
      async authorize(credentials, req) {
        try {
          // La lógica de renovación está en api/auth/refresh/route.ts
          const response = await fetch(
            `${process.env.NEXTAUTH_URL}/api/auth/refresh`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Cookie: req.headers?.cookie || "",
              },
            }
          );

          const data = await response.json();

          if (response.ok && data.accessToken) {
            // Devolver los datos del usuario con el nuevo token
            return {
              ...req.auth?.user, // Mantener los datos del usuario actuales
              token: data.accessToken,
            };
          }

          throw new Error(data.error || "Failed to refresh token");
        } catch (error) {
          console.error("Token refresh error:", error);
          throw new Error("RefreshAccessTokenError");
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Al iniciar sesión
      if (user) {
        token.id = user.id as string;
        token.email = user.email as string;
        token.name = user.name as string;
        token.role = (user.role as string) || "WORKER";
        token.accessToken = user.token as string;
        token.image = user.image || null;
        // Añadir tiempo de expiración (24 horas desde ahora)
        token.exp = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
      }

      // Actualizar token cuando se actualiza la sesión (por ejemplo, al actualizar el perfil)
      if (trigger === "update" && session) {
        if (session.user?.name) token.name = session.user.name;
        if (session.user?.image) token.image = session.user.image;
      }

      // Verificar si el token está por expirar (menos de 5 minutos)
      const shouldRefresh =
        token.exp && Math.floor(Date.now() / 1000) > token.exp - 5 * 60;

      if (shouldRefresh && token.accessToken) {
        try {
          const response = await fetch(
            `${process.env.NEXTAUTH_URL}/api/auth/refresh`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (response.ok) {
            const refreshedTokens = await response.json();
            if (refreshedTokens.accessToken) {
              token.accessToken = refreshedTokens.accessToken;
              token.exp =
                refreshedTokens.exp ||
                Math.floor(Date.now() / 1000) + 24 * 60 * 60;
            }
          } else {
            // Si falla, no alterar el token actual pero loguear el error
            console.warn("Fallo al renovar token, continuando con el actual");
          }
        } catch (error) {
          console.error("Error al intentar renovar el token:", error);
        }
      }

      // Verificar si el token ha expirado
      if (token.exp && Date.now() >= (token.exp as number) * 1000) {
        // Token expirado, forzar cierre de sesión
        console.log("Token expirado, marcando para forzar cierre de sesión");
        token.error = "TokenExpired";
        return {
          ...token,
          exp: 0, // Forzar expiración inmediata
        };
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.role = token.role as string;
        session.user.image = (token.image as string) || null;
        session.accessToken = token.accessToken as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login", // Error de autenticación redirige a login
    signOut: "/login",
  },
  debug: process.env.NODE_ENV === "development",
});
