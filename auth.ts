// web/auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET as string;
const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL as string;

if (!NEXTAUTH_SECRET) {
  console.error(
    "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
  );
  console.error("FATAL: Missing NEXTAUTH_SECRET environment variable.");
  console.error("Authentication will not work and may lead to security risks.");
  console.error(
    "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
  );
  // En un entorno de producción real, podrías querer lanzar un error para detener el build/deploy
  // if (process.env.NODE_ENV === 'production') {
  //   throw new Error("Missing NEXTAUTH_SECRET environment variable");
  // }
}
if (!NEXT_PUBLIC_API_URL && process.env.NODE_ENV !== "test") {
  console.warn(
    "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
  );
  console.warn("WARNING: Missing NEXT_PUBLIC_API_URL environment variable.");
  console.warn(
    "Login attempts will fail as the frontend cannot contact the backend API."
  );
  console.warn(
    "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
  );
  // if (process.env.NODE_ENV === 'production') {
  //   throw new Error("Missing NEXT_PUBLIC_API_URL environment variable");
  // }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 horas para la validez del JWT de NextAuth
  },
  providers: [
    Credentials({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "tu@email.com" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials, req) {
        // Loguear el inicio del intento de autorización
        console.log(
          "[Authorize Callback] Attempting authorization for email:",
          credentials?.email
        );

        if (!NEXT_PUBLIC_API_URL) {
          console.error(
            "[Authorize Callback] CRITICAL: NEXT_PUBLIC_API_URL is not defined. Cannot proceed."
          );
          return null;
        }
        if (!credentials?.email || !credentials?.password) {
          console.warn(
            "[Authorize Callback] Email or password missing in provided credentials. Denying authorization."
          );
          return null;
        }

        try {
          const loginApiUrl = `${NEXT_PUBLIC_API_URL}/auth/login`;
          console.log(
            `[Authorize Callback] Sending login request to backend: POST ${loginApiUrl}`
          );

          const response = await fetch(loginApiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          console.log(
            `[Authorize Callback] Backend response status: ${response.status}`
          );

          if (!response.ok) {
            let errorData = { message: `Backend returned ${response.status}` };
            try {
              // Intentar parsear el cuerpo del error, ya que puede contener información útil
              const errorBody = await response.text(); // Leer como texto primero
              if (errorBody) {
                errorData = JSON.parse(errorBody); // Luego intentar parsear como JSON
              }
            } catch (e) {
              console.warn(
                `[Authorize Callback] Could not parse JSON error response from backend. Status: ${response.status}. Response body might not be JSON.`
              );
            }
            console.warn(
              `[Authorize Callback] Backend login failed. Status: ${response.status}. Error details:`,
              errorData.message || response.statusText
            );
            return null; // Devuelve null si el backend no valida las credenciales
          }

          const data = await response.json();
          console.log(
            "[Authorize Callback] Backend login successful. Data received (structure check):",
            {
              userId: data.user?.id,
              email: data.user?.email,
              tokenPresent: !!data.token,
            }
          );

          if (data.token && data.user && data.user.id) {
            console.log(
              `[Authorize Callback] User data and token present for user ID: ${data.user.id}. Returning user object to NextAuth.`
            );
            // Este objeto es el que se pasa como 'user' al callback 'jwt'
            return {
              id: data.user.id.toString(), // NextAuth espera 'id' como string
              email: data.user.email as string,
              name: data.user.name as string,
              role: data.user.role as string,
              token: data.token, // Este es el accessToken de tu backend
            };
          } else {
            console.warn(
              "[Authorize Callback] Backend response was OK, but 'token' or 'user.id' missing from data. Denying authorization.",
              data
            );
            return null;
          }
        } catch (error) {
          console.error(
            "[Authorize Callback] Exception during fetch to backend /auth/login:",
            error
          );
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, account, profile }) {
      const now = Date.now();
      const logTokenExp = token.exp
        ? new Date((token.exp as number) * 1000).toISOString()
        : "N/A";
      console.log(
        `[JWT Callback] Trigger: "${trigger}", User ID from arg: ${user?.id}, Input token ID: ${token?.id}, Input token exp: ${logTokenExp}, Account provider: ${account?.provider}`
      );

      // 1. Cuando el usuario inicia sesión (trigger "signIn" o "signUp" y hay objeto 'user' del provider)
      if (
        user &&
        (trigger === "signIn" || trigger === "signUp") &&
        account?.provider === "credentials"
      ) {
        console.log(
          `[JWT Callback] Sign-in for user ID: ${user.id}. Populating new JWT token.`
        );
        token.id = user.id as string;
        token.email = user.email as string;
        token.name = user.name as string;
        token.role = (user as any).role as string;
        token.accessToken = (user as any).token as string;

        token.exp = Math.floor(now / 1000) + 24 * 60 * 60; // 24 horas
        token.error = undefined;

        const populatedTokenExpLog = token.exp
          ? new Date((token.exp as number) * 1000).toISOString()
          : "N/A";
        console.log(
          `[JWT Callback] Token populated on sign-in. New NextAuth exp: ${populatedTokenExpLog}, User ID: ${token.id}`
        );
      }

      // 2. VERIFICACIÓN CRÍTICA para sesiones existentes (leídas de la cookie)
      if (!user && !token.id) {
        console.warn(
          "[JWT Callback] CRITICAL: Token is missing 'id' (and not initial signIn). Session likely corrupted or incomplete. Invalidating session."
        );
        return {
          exp: 0,
          error: "InvalidSessionState_MissingId",
        };
      }

      // 3. Verificar expiración del token de NextAuth
      if (token.exp && now >= (token.exp as number) * 1000) {
        const expiredMsg = `[JWT Callback] NextAuth session JWT has EXPIRED. Original exp: ${new Date(
          (token.exp as number) * 1000
        ).toISOString()}, Now: ${new Date(now).toISOString()}.`;
        console.warn(expiredMsg);
        delete token.accessToken;
        delete (token as any).backendTokenExpiresAt;
        return {
          ...token,
          exp: 0,
          error: "NextAuthSessionExpired",
        };
      }

      // 4. Lógica de Refresco del Token del Backend (ACTUALMENTE DESACTIVADA)
      // console.log("[JWT Callback] Backend token refresh logic is currently SKIPPED.");

      const finalTokenExpLog = token.exp
        ? new Date((token.exp as number) * 1000).toISOString()
        : "N/A";
      console.log(
        `[JWT Callback] EXIT. Returning token with ID: ${token?.id}, NextAuth Exp: ${finalTokenExpLog}, Error: ${token.error}`
      );
      return token;
    },
    async session({ session, token }) {
      console.log(
        `[Session Callback] Populating client session from JWT token. Token ID: ${token?.id}, Token error: ${token?.error}, Token exp: ${token?.exp}`
      );

      if (token.id) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.role = token.role as string;
        session.accessToken = token.accessToken as string;
      } else {
        console.warn(
          "[Session Callback] Token from JWT callback is missing 'id'. Client session.user will be incomplete or undefined."
        );
        // @ts-ignore
        delete session.user;
        // @ts-ignore
        delete session.accessToken;
      }

      if (token.error) {
        (session as any).error = token.error;
        console.warn(
          `[Session Callback] Propagating error to client session object: ${token.error}`
        );
      }

      if (token.exp === 0 && !(session as any).error) {
        (session as any).error = "SessionForceInvalidatedByServer";
        console.warn(
          `[Session Callback] Token exp is 0, marking session with error: "SessionForceInvalidatedByServer"`
        );
      }

      console.log(
        `[Session Callback] EXIT. Client session object: UserID: ${
          session.user?.id
        }, SessionError: ${(session as any).error}, SessionExpires: ${
          session.expires
        }`
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
