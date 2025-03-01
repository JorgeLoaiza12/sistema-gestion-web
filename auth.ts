// auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { ZodError } from "zod";
import { signInSchema } from "./lib/zod";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        try {
          // Validamos las credenciales de prueba
          if (
            credentials?.email === "test@example.com" &&
            credentials?.password === "123456"
          ) {
            return {
              id: "1",
              email: "test@example.com",
              name: "Usuario de Prueba",
            };
          }
          return null;
        } catch (error) {
          if (error instanceof ZodError) {
            return null;
          }
          throw error;
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");

      if (isOnDashboard) {
        if (isLoggedIn) return true;
        // Redirige a login con returnUrl
        return Response.redirect(new URL("/login", nextUrl));
      }

      return true;
    },
  },
});
