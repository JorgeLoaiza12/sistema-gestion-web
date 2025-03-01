// middleware.ts
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const token = req.auth?.user;
  const isLoggedIn = !!token;
  const isAuthRoute =
    req.nextUrl.pathname.startsWith("/login") ||
    req.nextUrl.pathname.startsWith("/register") ||
    req.nextUrl.pathname.startsWith("/forgot-password");

  // Add security headers
  const headers = new Headers(req.headers);
  headers.set("X-Frame-Options", "DENY");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "same-origin");
  headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
  );

  // Si está autenticado y trata de acceder a rutas de auth, redirigir al dashboard
  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  // Si NO está autenticado y trata de acceder al dashboard, redirigir a login
  if (!isLoggedIn && req.nextUrl.pathname.startsWith("/dashboard")) {
    const redirectUrl = new URL("/login", req.nextUrl);
    redirectUrl.searchParams.set("from", req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Modificar la respuesta con los headers de seguridad
  const response = NextResponse.next({
    request: {
      headers,
    },
  });

  // Security: Remove powered-by header
  response.headers.delete("x-powered-by");

  return response;
});

export const config = {
  matcher: [
    // Rutas que requieren autenticación
    "/dashboard/:path*",
    // Rutas de autenticación
    "/login",
    "/register",
    "/forgot-password",
  ],
};
