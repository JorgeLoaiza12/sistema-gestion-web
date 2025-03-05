import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  // Usamos getToken para obtener la sesión
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  console.log("Token from NextAuth:", token);

  const publicPages = ["/login", "/register", "/forgot-password"];
  const isPublicPage = publicPages.some((page) =>
    request.nextUrl.pathname.startsWith(page)
  );
  const isDashboardPage = request.nextUrl.pathname.startsWith("/dashboard");

  if (!token && isDashboardPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (token && isPublicPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register", "/forgot-password"],
};
