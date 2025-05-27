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
        `[JWT Callback] Trigger: ${trigger}, User ID: ${user?.id}, Input token ID: ${token?.id}, Input token exp: ${logTokenExp}`
      );

      if (
        user &&
        (trigger === "signIn" || trigger === "signUp") &&
        account?.provider === "credentials"
      ) {
        console.log(
          `[JWT Callback] Sign-in for user ID: ${user.id}. Populating token.`
        );
        token.id = user.id as string;
        token.email = user.email as string;
        token.name = user.name as string;
        token.role = (user as any).role as string;
        token.accessToken = (user as any).token as string; // Token del backend
        // Establecer la expiración del token de NextAuth. No más lógica de refresco aquí por ahora.
        token.exp = Math.floor(now / 1000) + 24 * 60 * 60; // 24 horas
        token.error = undefined; // Limpiar errores
      }

      // VERIFICACIÓN CRÍTICA: Si en cualquier punto (que no sea el signIn inicial donde user existe)
      // el token NO tiene un 'id', consideramos la sesión inválida.
      // Esto podría pasar si la cookie de sesión se corrompe o si una lambda fallida devuelve un token parcial.
      if (!user && !token.id) {
        console.warn(
          "[JWT Callback] Token is missing 'id' and no 'user' object present (not initial signIn). Invalidating session."
        );
        return { ...token, exp: 0, error: "InvalidSessionState" }; // Forzar expiración y marcar error
      }

      // Verificar expiración del token de NextAuth (el JWT de 24h)
      if (token.exp && now >= (token.exp as number) * 1000) {
        console.warn(
          `[JWT Callback] NextAuth session JWT has EXPIRED. Original exp: ${new Date(
            (token.exp as number) * 1000
          ).toISOString()}. Invalidating.`
        );
        delete token.accessToken;
        return { ...token, exp: 0, error: "SessionExpired" };
      }

      const finalTokenExpLog = token.exp
        ? new Date((token.exp as number) * 1000).toISOString()
        : "N/A";
      console.log(
        `[JWT Callback] EXIT. Returning token ID: ${token?.id}, NextAuth Exp: ${finalTokenExpLog}, Error: ${token.error}`
      );
      return token;
    },
    async session({ session, token }) {
      console.log(
        `[Session Callback] Populating session from token ID: ${token.id}. Token error: ${token.error}`
      );
      if (token.id) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.role = token.role as string;
        session.accessToken = token.accessToken as string;
      } else {
        // Si el token no tiene id, la sesión es inválida.
        // Esto es una capa extra de seguridad. El middleware o httpClient deberían actuar antes.
        console.warn(
          "[Session Callback] Token provided to session callback is missing 'id'. Session will be incomplete."
        );
      }

      if (token.error) {
        (session as any).error = token.error;
        console.warn(
          `[Session Callback] Propagating error to session object: ${token.error}`
        );
      }
      if (token.exp === 0 && !(session as any).error) {
        // Si exp es 0 pero no hay error explícito, marcarla como expirada
        (session as any).error = "SessionForceExpired";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  debug: process.env.NODE_ENV === "development",
});
