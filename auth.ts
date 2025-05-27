// web/auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
// No necesitamos decodeJWT aquí si no vamos a refrescar el token del backend desde aquí

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET as string;
const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL as string;

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 horas
  },
  providers: [
    Credentials({
      // ... tu configuración de Credentials authorize (sin cambios) ...
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials, req) {
        console.log("[Authorize Callback] Attempting auth...");
        if (!NEXT_PUBLIC_API_URL) {
          console.error(
            "[Authorize Callback] NEXT_PUBLIC_API_URL not defined."
          );
          return null;
        }
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const response = await fetch(`${NEXT_PUBLIC_API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.warn(
              `[Authorize Callback] Login failed ${response.status}`,
              errorData.message
            );
            return null;
          }
          const data = await response.json();
          if (data.token && data.user && data.user.id) {
            console.log(
              "[Authorize Callback] Login successful for user ID:",
              data.user.id
            );
            return {
              id: data.user.id.toString(),
              email: data.user.email,
              name: data.user.name,
              role: data.user.role,
              token: data.token, // accessToken del backend
            };
          }
          return null;
        } catch (error) {
          console.error("[Authorize Callback] Exception:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, account }) {
      const now = Date.now();
      const logTokenExp = token.exp
        ? new Date((token.exp as number) * 1000).toISOString()
        : "N/A";
      console.log(
        `[JWT MINIMAL+] Trigger: ${trigger}, User ID from arg: ${user?.id}, Input token ID: ${token?.id}, Input token exp: ${logTokenExp}`
      );

      if (
        user &&
        (trigger === "signIn" || trigger === "signUp") &&
        account?.provider === "credentials"
      ) {
        console.log(
          `[JWT MINIMAL+] Sign-in for user ID: ${user.id}. Populating token.`
        );
        token.id = user.id as string;
        token.email = user.email as string; // Necesario para session callback
        token.name = user.name as string; // Necesario para session callback
        token.role = (user as any).role as string; // Necesario para session callback
        token.accessToken = (user as any).token as string; // Guardar el accessToken del backend

        // Establecer la expiración del token de NextAuth (el que gestiona la sesión del navegador)
        token.exp = Math.floor(now / 1000) + 24 * 60 * 60; // 24 horas
        token.error = undefined;
        console.log(
          `[JWT MINIMAL+] Token populated. NextAuth exp: ${new Date(
            (token.exp as number) * 1000
          ).toISOString()}`
        );
      }

      // Si no es signIn inicial, y el token que viene de la cookie no tiene un 'id', es inválido.
      // Esto es crucial si una ejecución anterior del jwt callback hizo timeout y no guardó bien.
      if (!user && !token.id) {
        console.warn(
          "[JWT MINIMAL+] Token is missing 'id' (not initial signIn). Invalidating session."
        );
        return { exp: 0, error: "CorruptedSessionToken" }; // Devolver un token mínimo y expirado
      }

      // Verificar expiración del token de NextAuth
      if (token.exp && now >= (token.exp as number) * 1000) {
        console.warn(
          `[JWT MINIMAL+] NextAuth JWT has EXPIRED. Original exp: ${new Date(
            (token.exp as number) * 1000
          ).toISOString()}.`
        );
        delete token.accessToken; // Limpiar accessToken del backend
        return { ...token, exp: 0, error: "NextAuthSessionExpired" };
      }

      console.log(
        `[JWT MINIMAL+] EXIT. Returning token ID: ${token?.id}, NextAuth Exp: ${
          token.exp
            ? new Date((token.exp as number) * 1000).toISOString()
            : "N/A"
        }`
      );
      return token;
    },
    async session({ session, token }) {
      console.log(
        `[Session MINIMAL+] Populating session from token ID: ${token.id}. Token error: ${token.error}`
      );
      if (token.id) {
        // Solo popular si el token tiene ID
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.role = token.role as string;
        session.accessToken = token.accessToken as string;
      } else {
        console.warn(
          "[Session MINIMAL+] Token missing 'id', session.user will be incomplete."
        );
        // No poner datos de usuario si el token es inválido
      }

      if (token.error) {
        (session as any).error = token.error;
      }
      // Si el token fue explícitamente expirado (exp=0) y no tiene error, añadir uno.
      if (token.exp === 0 && !(session as any).error) {
        (session as any).error = "SessionForceInvalidated";
      }
      console.log(
        `[Session MINIMAL+] EXIT. Session user ID: ${
          session.user?.id
        }, Session error: ${(session as any).error}`
      );
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  debug: process.env.NODE_ENV === "development",
});
