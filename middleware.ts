// web/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
// import { getToken } from "next-auth/jwt"; // No se usa si está desactivado

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log(
    `[Middleware] Path: ${pathname} - MIDDLEWARE TEMPORALMENTE DESACTIVADO. Passing all requests through.`
  );

  // Simplemente permitir todas las peticiones
  return NextResponse.next();
}

// Para desactivar completamente el middleware, también puedes vaciar o comentar el matcher.
// Si dejas el matcher original, el middleware se ejecutará para esas rutas pero solo hará console.log y NextResponse.next().
// Para una desactivación más completa, usa un matcher que no coincida con nada o comenta el objeto config.
export const config = {
  // matcher: [], // Un matcher vacío significa que no se aplicará a ninguna ruta.
  // O comenta todo el objeto config para que el archivo no exporte un 'config' de middleware:
  /*
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|assets|.*\\..*).*)',
    "/dashboard/:path*",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ],
  */
};
