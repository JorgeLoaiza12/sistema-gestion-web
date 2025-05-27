// web/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  console.log(`[Middleware] Path: ${pathname}${search}`);

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    console.error(
      "[Middleware] FATAL: NEXTAUTH_SECRET is not defined. Authentication will not work."
    );
    // En un caso real, podrías redirigir a una página de error o simplemente no proteger nada.
    // Por ahora, permitiremos el paso para no bloquear completamente en caso de error de config.
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: secret,
    // secureCookie: process.env.NODE_ENV === "production", // Ya no es necesario con getToken v5+ si NEXTAUTH_URL es https
    // Dejar que getToken infiera de NEXTAUTH_URL y los prefijos de cookie
    // Si NEXTAUTH_URL empieza con https://, NextAuth usa __Secure- prefijo y secure: true
  });

  // Loguear el token completo para depuración intensiva
  // Cuidado con loguear tokens completos en producción si contienen información sensible no encriptada
  // console.log("[Middleware] Token received by getToken:", JSON.stringify(token, null, 2));

  // Condensar log del token para producción
  if (token) {
    console.log(
      `[Middleware] Token found: User ID: ${token.id}, Email: ${
        token.email
      }, Role: ${token.role}, Error: ${token.error}, Exp: ${
        token.exp ? new Date(token.exp * 1000).toISOString() : "N/A"
      }`
    );
  } else {
    console.log("[Middleware] No token found by getToken().");
  }

  let sessionConsideredInvalid = false;
  let invalidReason = "";

  if (token) {
    // Si el token existe pero le falta el 'id' (que asignamos en jwt callback)
    if (!token.id) {
      invalidReason = "Token lacks ID";
      sessionConsideredInvalid = true;
    }
    // O si el token tiene una propiedad 'error' establecida por nuestros callbacks
    if (token.error) {
      invalidReason = `Token has error: ${token.error}`;
      sessionConsideredInvalid = true;
    }
    // O si el campo 'exp' del token de NextAuth indica que ha expirado
    if (token.exp && Date.now() >= token.exp * 1000) {
      invalidReason = `Token exp field indicates expiration (exp: ${new Date(
        token.exp * 1000
      ).toISOString()})`;
      sessionConsideredInvalid = true;
    }
  } else {
    // No hay token en absoluto, esto es normal para un usuario no autenticado.
    // No lo consideramos "inválido" per se, sino "ausente".
    // La lógica de abajo manejará la redirección si es una página protegida.
  }

  const publicPages = [
    "/login",
    "/register", // Si tienes página de registro
    "/forgot-password", // Si tienes
    "/reset-password", // Si tienes
    // Añade otras páginas públicas aquí (ej. landing page, /about, etc.)
  ];
  const isPublicPage = publicPages.some((page) => pathname.startsWith(page));
  const isDashboardPage = pathname.startsWith("/dashboard"); // Asumiendo que tus páginas protegidas están bajo /dashboard

  // 1. Si la sesión se considera inválida (token corrupto, con error, o explícitamente expirado)
  if (sessionConsideredInvalid) {
    console.warn(
      `[Middleware] Session considered invalid: "${invalidReason}". Redirecting to login and attempting to clear auth cookies.`
    );

    const loginUrl = new URL("/login", request.url);
    // Solo añadir callbackUrl si NO estamos ya intentando acceder a /login u otra página pública
    if (!isPublicPage) {
      loginUrl.searchParams.set(
        "callbackUrl",
        encodeURIComponent(pathname + search)
      );
    }
    loginUrl.searchParams.set(
      "error",
      (token?.error as string) || "InvalidSessionState"
    );

    const response = NextResponse.redirect(loginUrl);

    // Nombres de cookies de NextAuth
    const cookieNames = [
      "next-auth.session-token",
      "next-auth.callback-url",
      "next-auth.csrf-token", // Nombres estándar
      "__Secure-next-auth.session-token",
      "__Secure-next-auth.callback-url",
      "__Secure-next-auth.csrf-token", // Para HTTPS
      "__Host-next-auth.session-token", // Para HTTPS y mismo host sin subdominios
    ];
    // También cualquier cookie personalizada que pudieras haber establecido.
    // response.cookies.delete("mi-cookie-custom");

    cookieNames.forEach((name) => {
      response.cookies.delete(name, {
        path: "/",
        domain: request.nextUrl.hostname,
      }); // Intentar con dominio
      response.cookies.delete(name, { path: "/" }); // Intentar sin dominio (más general)
    });
    console.log("[Middleware] Attempted to clear auth cookies.");
    return response;
  }

  // 2. Si NO hay token (getToken() devolvió null) Y se intenta acceder a una página protegida
  if (!token && isDashboardPage) {
    console.log(
      "[Middleware] No token, accessing a protected dashboard page. Redirecting to login."
    );
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set(
      "callbackUrl",
      encodeURIComponent(pathname + search)
    );
    return NextResponse.redirect(loginUrl);
  }

  // 3. Si HAY un token válido Y se intenta acceder a una página pública (como /login)
  if (token && isPublicPage) {
    // Excepción: si estamos en /login y hay un error de sesión, no redirigir
    // Esto permite que la página de login muestre el error
    const errorParam = request.nextUrl.searchParams.get("error");
    if (pathname === "/login" && errorParam) {
      console.log(
        "[Middleware] Token exists, on login page with error. Allowing request."
      );
      return NextResponse.next();
    }

    console.log(
      "[Middleware] Token exists and is valid, accessing a public page. Redirecting to dashboard."
    );
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Si ninguna de las condiciones anteriores se cumple, permitir el acceso
  console.log("[Middleware] Passing request through.");
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - assets (tus assets públicos si los tienes en /public/assets)
     * - manifest.json, etc.
     */
    "/((?!api|_next/static|_next/image|favicon.ico|assets|.*\\..*).*)", // Excluye archivos con extensiones y rutas comunes
    // Incluye explícitamente las rutas que sí quieres que pasen por el middleware si la regex anterior las excluye
    "/dashboard/:path*",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ],
};
