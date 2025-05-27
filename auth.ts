// web/auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
// No necesitamos decodeJWT de tokenService.ts aquí si NO vamos a implementar la lógica de
// refresco del token del backend DENTRO de este callback jwt.
// Si en el futuro se reintroduce el refresco aquí, necesitaríamos una función decodeJWT fiable.

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET as string;
const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL as string;

if (!NEXTAUTH_SECRET) {
  // Esto es un error crítico y debería detener el inicio en la mayoría de los casos.
  // En un entorno serverless como Vercel, el error podría no detener el build
  // pero causará fallos en runtime.
  console.error(
    "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
  );
  console.error("FATAL: Missing NEXTAUTH_SECRET environment variable.");
  console.error("Authentication will not work and may lead to security risks.");
  console.error(
    "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
  );
  // Considera lanzar un error aquí si el entorno no es de testing.
  // if (process.env.NODE_ENV !== 'test') {
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
  // if (process.env.NODE_ENV !== 'test') {
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
        console.log(
          "[Authorize Callback] Attempting authorization with email:",
          credentials?.email
        );
        if (!NEXT_PUBLIC_API_URL) {
          console.error(
            "[Authorize Callback] CRITICAL: NEXT_PUBLIC_API_URL is not defined. Cannot proceed with authorization."
          );
          return null; // No se puede contactar al backend
        }
        if (!credentials?.email || !credentials?.password) {
          console.warn(
            "[Authorize Callback] Email or password missing in provided credentials."
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
              errorData = await response.json();
            } catch (e) {
              console.warn(
                "[Authorize Callback] Could not parse JSON error response from backend."
              );
            }
            console.warn(
              `[Authorize Callback] Backend login failed. Status: ${response.status}. Error:`,
              errorData.message || response.statusText
            );
            return null; // Devuelve null si el backend no valida las credenciales
          }

          const data = await response.json();
          // Loguear solo los campos que esperas, no el token completo en producción por seguridad.
          console.log(
            "[Authorize Callback] Backend login successful. User data received (structure check):",
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
              role: data.user.role as string, // Asegurar que el role viene y es un string
              token: data.token, // Este es el accessToken de tu backend
              // Puedes añadir más campos que devuelva tu backend y quieras en el objeto 'user' inicial
            };
          } else {
            console.warn(
              "[Authorize Callback] Backend response was OK, but 'token' or 'user.id' missing from data.",
              data
            );
            return null;
          }
        } catch (error) {
          console.error(
            "[Authorize Callback] Exception during fetch to backend /auth/login:",
            error
          );
          return null; // Fallo en la comunicación o error inesperado
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
        token.role = (user as any).role as string; // El 'user' aquí viene de 'authorize'
        token.accessToken = (user as any).token as string; // Guardar el accessToken del backend

        // Establecer la expiración del token de NextAuth (el que gestiona la sesión del navegador)
        // Este es el token JWT que NextAuth almacena en la cookie del navegador.
        token.exp = Math.floor(now / 1000) + 24 * 60 * 60; // 24 horas desde ahora
        token.error = undefined; // Limpiar cualquier error previo de un token antiguo

        const populatedTokenExpLog = token.exp
          ? new Date((token.exp as number) * 1000).toISOString()
          : "N/A";
        console.log(
          `[JWT Callback] Token populated on sign-in. New NextAuth exp: ${populatedTokenExpLog}, User ID: ${token.id}`
        );
      }

      // 2. En llamadas subsiguientes (trigger undefined, o "update"), 'user' es undefined.
      // El 'token' que llega es el JWT de NextAuth leído de la cookie.
      // VERIFICACIÓN CRÍTICA: Si el token leído de la cookie no tiene un 'id',
      // consideramos la sesión inválida. Esto puede ocurrir si una ejecución previa del
      // jwt callback hizo timeout y no pudo guardar un token completo en la cookie.
      if (!user && !token.id) {
        // No es el signIn inicial Y el token actual no tiene ID
        console.warn(
          "[JWT Callback] CRITICAL: Token is missing 'id' (and not initial signIn). Session likely corrupted or incomplete. Invalidating session."
        );
        // Devolver un token mínimo, expirado y con error.
        // Esto será detectado por el middleware y httpClient.
        return {
          exp: 0, // Expirar inmediatamente
          error: "InvalidSessionState_MissingId",
        };
      }

      // 3. Verificar expiración del token de NextAuth (el JWT de 24h)
      // Esto se ejecuta en cada llamada a getToken/getSession.
      if (token.exp && now >= (token.exp as number) * 1000) {
        const expiredMsg = `[JWT Callback] NextAuth session JWT has EXPIRED. Original exp: ${new Date(
          (token.exp as number) * 1000
        ).toISOString()}, Now: ${new Date(now).toISOString()}.`;
        console.warn(expiredMsg);
        delete token.accessToken; // Limpiar el accessToken del backend ya que la sesión de NextAuth terminó
        delete (token as any).backendTokenExpiresAt; // Si existiera de una lógica de refresco anterior
        // Devolver el token con exp=0 y un error para señalar la expiración.
        return {
          ...token, // Propagar otros campos si existen (id, email, etc.)
          exp: 0,
          error: "NextAuthSessionExpired",
        };
      }

      // 4. Lógica de Refresco del Token del Backend (ACTUALMENTE DESACTIVADA para evitar timeouts de lambda)
      // Si en el futuro el backend /auth/refresh-token es rápido y fiable, se puede reintroducir aquí.
      // console.log("[JWT Callback] Backend token refresh logic is currently SKIPPED to prevent lambda timeouts.");
      // Ejemplo de cómo sería (requiere que decodeJWT y /api/auth/refresh funcionen bien):
      /*
      if (token.accessToken) {
        const decodedBackendToken = decodeJWT(token.accessToken as string); // Necesitarías una función decodeJWT fiable
        if (decodedBackendToken && decodedBackendToken.exp) {
          const backendTokenExpiresAt = decodedBackendToken.exp * 1000;
          const fiveMinutesInMs = 5 * 60 * 1000;
          if (backendTokenExpiresAt - now < fiveMinutesInMs) {
            console.log("[JWT Callback] Backend accessToken needs refresh. Attempting...");
            // ... await fetch('/api/auth/refresh', ...) ...
            // ... si éxito: actualizar token.accessToken, token.backendTokenExpiresAt ...
            // ... si fallo: token.error = "RefreshFailed"; token.exp = 0; (para forzar logout) ...
          }
        } else if (token.accessToken) { // Si hay accessToken pero no se pudo decodificar o no tiene exp
            console.warn("[JWT Callback] Backend accessToken present but could not determine its expiration. Consider it risky.");
            // Podrías forzar un error o un refresco aquí si es crítico.
        }
      }
      */

      const finalTokenExpLog = token.exp
        ? new Date((token.exp as number) * 1000).toISOString()
        : "N/A";
      console.log(
        `[JWT Callback] EXIT. Returning token with ID: ${token?.id}, NextAuth Exp: ${finalTokenExpLog}, Error: ${token.error}`
      );
      return token; // Devuelve el token (potencialmente actualizado o el mismo)
    },
    async session({ session, token }) {
      // El callback 'session' se ejecuta después de 'jwt'.
      // El 'token' aquí es el objeto devuelto por el callback 'jwt'.
      // Este callback puebla el objeto 'session' que se usa en el cliente con useSession() o getSession().
      console.log(
        `[Session Callback] Populating client session from JWT token. Token ID: ${token?.id}, Token error: ${token?.error}, Token exp: ${token?.exp}`
      );

      if (token.id) {
        // Solo popular datos del usuario si el token JWT tiene un ID
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.role = token.role as string;
        session.accessToken = token.accessToken as string; // El token de acceso de tu backend
      } else {
        // Si el token JWT no tiene ID (ej. porque jwt callback lo invalidó),
        // la sesión del cliente no tendrá datos de usuario.
        console.warn(
          "[Session Callback] Token from JWT callback is missing 'id'. Client session.user will be incomplete or undefined."
        );
        // @ts-ignore // Limpiar explícitamente por si la sesión anterior tenía datos
        delete session.user;
      }

      // Propagar el error del token JWT a la sesión del cliente
      if (token.error) {
        (session as any).error = token.error;
        console.warn(
          `[Session Callback] Propagating error to client session object: ${token.error}`
        );
      }

      // Si el token JWT fue explícitamente expirado (exp=0) y no tiene un error más específico,
      // se puede añadir uno para que el cliente lo sepa.
      if (token.exp === 0 && !(session as any).error) {
        (session as any).error = "SessionForceInvalidatedByServer";
        console.warn(
          `[Session Callback] Token exp is 0, marking session with error: "SessionForceInvalidatedByServer"`
        );
      }

      // session.expires es manejado automáticamente por NextAuth basado en el 'exp' del token JWT.
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
    signIn: "/login", // Tu página de inicio de sesión personalizada
    error: "/login", // Página a la que redirigir en caso de errores de autenticación (ej. OAuth, Email link)
    // signOut: '/goodbye', // Opcional: página a la que redirigir tras cerrar sesión
  },
  debug: process.env.NODE_ENV === "development", // Activa logs detallados de NextAuth en desarrollo
});
