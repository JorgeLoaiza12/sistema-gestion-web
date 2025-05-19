import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      image?: string | null;
    };
    expires: string; // Esta es la expiración de la sesión de NextAuth
    accessToken?: string; // Token de acceso de tu backend
    error?: "RefreshFailed" | "TokenExpired" | "SessionExpiredForceLogout"; // Para errores de token
  }

  interface User {
    // El objeto 'user' que devuelve tu provider 'authorize'
    id: string;
    email: string;
    name: string;
    role: string;
    image?: string | null;
    token?: string; // accessToken del backend
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    name: string;
    role: string;
    image?: string | null;
    accessToken?: string; // Token de acceso de tu backend
    backendTokenExpiresAt?: number; // Expiración del accessToken del backend en ms
    error?: "RefreshFailed" | "TokenExpired" | "SessionExpiredForceLogout"; // Para manejar errores de refresco
    // 'exp' es una propiedad estándar de JWT para la expiración del token de NextAuth (en segundos)
  }
}
