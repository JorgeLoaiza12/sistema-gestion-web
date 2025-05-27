// web/auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { decodeJWT } from "@/lib/tokenService"; // Aunque no lo usemos en el JWT simplificado, lo mantenemos por si se usa en otra parte o para el futuro.

// Asegúrate de que tus variables de entorno estén definidas
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET as string;
const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL as string;

if (!NEXTAUTH_SECRET) {
  throw new Error("Missing NEXTAUTH_SECRET environment variable");
}
if (!NEXT_PUBLIC_API_URL && process.env.NODE_ENV !== "test") {
  // No fallar en tests si no se necesita API
  // En un entorno real, esto debería ser un error si no es para testing
  console.warn(
    "Missing NEXT_PUBLIC_API_URL environment variable. API calls might fail."
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 horas para la sesión de NextAuth (el JWT de NextAuth)
  },
  providers: [
    Credentials({
      id: "credentials", // Identificador del proveedor
      name: "Credentials", // Nombre que se muestra en la página de inicio de sesión (opcional)
      credentials: {
        email: { label: "Email", type: "email", placeholder: "tu@email.com" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials, req) {
        console.log("[Authorize Callback] Attempting authorization...");
        if (!NEXT_PUBLIC_API_URL) {
          console.error(
            "[Authorize Callback] NEXT_PUBLIC_API_URL is not defined. Cannot authorize."
          );
          return null;
        }
        if (!credentials?.email || !credentials?.password) {
          console.warn(
            "[Authorize Callback] Email o contraseña faltantes en las credenciales."
          );
          return null; // O lanzar un error específico que se mapee en la página de login
        }

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
            const errorData = await response
              .json()
              .catch(() => ({ message: "Error desconocido del backend" }));
            console.warn(
              `[Authorize Callback] Login failed with status ${response.status}. Error:`,
              errorData.message || response.statusText
            );
            // Puedes lanzar un error aquí para pasarlo a la página de login
            // throw new Error(errorData.message || `Error ${response.status}`);
            return null; // O devolver null para un error genérico
          }

          const data = await response.json();
          console.log(
            "[Authorize Callback] Login successful. Data received from backend."
          );

          // Asegurarse de que el backend devuelve 'token' y 'user' con 'id'
          if (data.token && data.user && data.user.id) {
            return {
              id: data.user.id.toString(), // NextAuth espera 'id' como string
              email: data.user.email as string, // Asegurar que el email viene
              name: data.user.name as string, // Asegurar que el name viene
              role: data.user.role as string, // Asegurar que el role viene
              token: data.token, // Este es el accessToken del backend
              // Añadir cualquier otro campo del usuario que quieras propagar al token de NextAuth
            };
          }
          console.warn(
            "[Authorize Callback] Token o datos de usuario faltantes en la respuesta del backend."
          );
          return null;
        } catch (error) {
          console.error(
            "[Authorize Callback] Exception during authorization request:",
            error
          );
          // throw new Error("No se pudo conectar con el servicio de autenticación."); // Error más genérico para el usuario
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session, account }) {
      const now = Date.now();
      // El console.log original tenía un problema de formato con las fechas en el string template.
      // Vamos a loguear los valores directamente o pre-formatearlos.
      const tokenExpLog = token.exp
        ? new Date((token.exp as number) * 1000).toISOString()
        : "N/A";
      const backendTokenExpLog = (token as any).backendTokenExpiresAt
        ? new Date((token as any).backendTokenExpiresAt).toISOString()
        : "N/A";
      console.log(
        `[JWT CALLBACK DEBUG ENTRY] Trigger: ${trigger}, Now: ${new Date(
          now
        ).toISOString()}, Current Token Exp: ${tokenExpLog}, Backend Exp: ${backendTokenExpLog}, Error: ${
          (token as any).error
        }`
      );

      if (user && trigger === "signIn" && account?.provider === "credentials") {
        // Proceso de inicio de sesión inicial o refresco manual
        console.log(
          "[JWT CALLBACK DEBUG] Initial sign-in via credentials. User ID:",
          user.id
        );
        token.id = user.id as string;
        token.email = user.email as string;
        token.name = user.name as string;
        token.role = (user as any).role as string; // Asegúrate que 'role' venga en el objeto 'user' de authorize
        token.accessToken = (user as any).token as string; // Token de acceso del backend

        // ----- INICIO DE SECCIÓN SIMPLIFICADA PARA DEBUG -----
        // NO INTENTAR DECODIFICAR accessToken DEL BACKEND NI ESTABLECER backendTokenExpiresAt POR AHORA
        // NO INTENTAR REFRESCAR EL TOKEN DEL BACKEND DESDE AQUÍ
        console.log(
          "[JWT CALLBACK DEBUG] Simplified logic active: Skipping backend token decode and all refresh logic to diagnose lambda timeouts."
        );
        delete (token as any).backendTokenExpiresAt; // Limpiar por si existía de una sesión anterior
        // ----- FIN DE SECCIÓN SIMPLIFICADA PARA DEBUG -----

        // El token de NextAuth (este 'token' JWT) durará 24 horas por defecto (configurado en session.maxAge)
        // Sobrescribimos 'exp' solo si es necesario o para ser explícitos.
        token.exp = Math.floor(now / 1000) + 24 * 60 * 60; // 24 horas desde ahora
        token.error = undefined; // Limpiar cualquier error previo
        const newTokenExpLog = token.exp
          ? new Date((token.exp as number) * 1000).toISOString()
          : "N/A";
        console.log(
          `[JWT CALLBACK DEBUG] NextAuth token 'exp' explicitly set to: ${newTokenExpLog} for user ${user.id}`
        );
      }

      // Si hay un trigger de "update" (ej. update({ name: "New Name" }) desde el cliente)
      if (trigger === "update" && session) {
        console.log(
          "[JWT CALLBACK DEBUG] Update trigger. Updating token with session data:",
          session
        );
        if (session.name) token.name = session.name;
        if (session.email) token.email = session.email; // Si permites actualizar email
        if (session.role) token.role = session.role; // Si permites actualizar rol
        // No tocar accessToken o exp aquí a menos que la actualización específicamente lo provea
      }

      // ----- INICIO DE LÓGICA DE REFRESH COMENTADA -----
      // Toda la lógica que teníamos para:
      // 1. Decodificar token.accessToken
      // 2. Calcular token.backendTokenExpiresAt
      // 3. Verificar si token.backendTokenExpiresAt - now < UMBRAL_REFRESCO
      // 4. Si es así, `await fetch('/api/auth/refresh', ...)`
      // 5. Manejar la respuesta: actualizar token.accessToken, token.backendTokenExpiresAt, y
      //    si falla el refresco, poner token.exp = 0
      // ESTÁ TEMPORALMENTE DESACTIVADA PARA ESTE DIAGNÓSTICO.
      // console.log("[JWT CALLBACK DEBUG] All backend token refresh logic is currently COMMENTED OUT.");
      // ----- FIN DE LÓGICA DE REFRESH COMENTADA -----

      // Verificar la expiración del token de NextAuth (el JWT que dura 24h)
      // Esta es la expiración propia del token de sesión de NextAuth, no del token del backend.
      if (token.exp && now >= (token.exp as number) * 1000) {
        const expiredMsg = `[JWT CALLBACK DEBUG] NextAuth session JWT has EXPIRED. Original exp: ${new Date(
          (token.exp as number) * 1000
        ).toISOString()}, Now: ${new Date(
          now
        ).toISOString()}. Invalidating token by setting exp to 0.`;
        console.warn(expiredMsg);
        delete token.accessToken; // Quitar el token del backend ya que la sesión de NextAuth terminó
        delete (token as any).backendTokenExpiresAt; // Limpiar esto también
        delete (token as any).error; // Limpiar errores
        return { ...token, exp: 0 }; // Indicar a NextAuth que la sesión ha terminado efectivamente
      }

      const finalTokenExpLog = token.exp
        ? new Date((token.exp as number) * 1000).toISOString()
        : "N/A";
      const finalBackendTokenExpLog = (token as any).backendTokenExpiresAt
        ? new Date((token as any).backendTokenExpiresAt).toISOString()
        : "N/A"; // Será N/A en este modo debug
      console.log(
        `[JWT CALLBACK DEBUG EXIT] Returning token. NextAuth Exp: ${finalTokenExpLog}, Backend Exp: ${finalBackendTokenExpLog}, Error: ${
          (token as any).error
        }`
      );
      return token;
    },
    async session({ session, token }) {
      // La sesión del cliente obtiene la información del token JWT de NextAuth
      console.log(
        `[Session Callback] Populating session from token for user ID: ${token.id}`
      );
      session.user.id = token.id as string;
      session.user.name = token.name as string;
      session.user.email = token.email as string;
      session.user.role = token.role as string; // Asegúrate que 'role' está en el token
      // session.user.image = token.picture as string; // Si tuvieras imagen

      session.accessToken = token.accessToken as string; // Este es el token de acceso del backend

      // Si el token JWT de NextAuth fue marcado como expirado (exp=0)
      if (token.exp === 0) {
        (session as any).error = "SessionExpired"; // Señalar error de sesión expirada
        console.warn(
          "[Session Callback] Session is marked as expired based on token.exp === 0."
        );
      } else if ((token as any).error) {
        (session as any).error = (token as any).error; // Propagar otros errores (ej. "RefreshFailed")
        console.warn(
          `[Session Callback] Propagating error to session: ${
            (token as any).error
          }`
        );
      }

      // NextAuth maneja session.expires basado en token.exp
      // console.log("[Session Callback] Session object being returned:", session);
      return session;
    },
  },
  pages: {
    signIn: "/login", // Página de inicio de sesión personalizada
    error: "/login", // Página para mostrar errores de autenticación (ej. credenciales incorrectas)
    // signOut: '/login', // Página a la que redirigir después de cerrar sesión (opcional)
    // verifyRequest: '/auth/verify-request', // Para magic links (email provider)
    // newUser: '/auth/new-user' // Nueva página de usuario (si se usa email provider para primer login)
  },
  debug: process.env.NODE_ENV === "development", // Activar logs de debug de NextAuth en desarrollo
});
