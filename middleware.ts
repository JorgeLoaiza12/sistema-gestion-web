import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  // Usamos getToken para obtener la sesión
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
  });

  const publicPages = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ];
  const isPublicPage = publicPages.some((page) =>
    request.nextUrl.pathname.startsWith(page)
  );
  const isDashboardPage = request.nextUrl.pathname.startsWith("/dashboard");

  // Comprobar si el token ha expirado
  if (token && token.exp && Date.now() >= token.exp * 1000) {
    console.log("Token ha expirado. Redirigiendo a la página de login.");

    // Crear una respuesta que redirige al login
    const response = NextResponse.redirect(new URL("/login", request.url));

    // Limpiar las cookies relacionadas con la autenticación
    // Utilizamos el mismo nombre de cookie que NextAuth usa para la sesión
    response.cookies.delete("next-auth.session-token");
    response.cookies.delete("next-auth.callback-url");
    response.cookies.delete("next-auth.csrf-token");

    // Si estás usando una cookie segura en producción
    if (process.env.NODE_ENV === "production") {
      response.cookies.delete("__Secure-next-auth.session-token");
      response.cookies.delete("__Secure-next-auth.callback-url");
      response.cookies.delete("__Secure-next-auth.csrf-token");
    }

    // También podemos eliminar cualquier cookie personalizada que hayas definido
    response.cookies.delete("csrfToken");

    return response;
  }

  // Verificación de páginas protegidas
  if (!token && isDashboardPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", encodeURI(request.nextUrl.pathname));
    return NextResponse.redirect(url);
  }

  // Redirección si el usuario ya está autenticado pero intenta acceder a páginas públicas
  if (token && isPublicPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ],
};
