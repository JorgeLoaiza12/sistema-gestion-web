import type { NextAuthConfig } from "next-auth";
import { z } from "zod";

export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
    signOut: "/login",
    verifyRequest: "/verify-request",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 días
    updateAge: 24 * 60 * 60, // 24 horas
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      const isOnAuth =
        nextUrl.pathname.startsWith("/login") ||
        nextUrl.pathname.startsWith("/register");

      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirige a /login
      } else if (isOnAuth) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        return true;
      }
      return true;
    },
  },
  events: {
    async signIn({ user }) {
      console.log("User signed in:", user.email);
    },
    async signOut({ token }) {
      console.log("User signed out:", token.email);
    },
    async error(error) {
      console.error("Auth error:", error);
    },
  },
} satisfies NextAuthConfig;

export const loginSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export type LoginSchema = z.infer<typeof loginSchema>;
