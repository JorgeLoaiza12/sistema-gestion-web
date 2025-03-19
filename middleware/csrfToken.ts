// middleware/csrfToken.ts (mejorado)
import { NextRequest, NextResponse } from "next/server";

// Lista de rutas sensibles que requieren protección CSRF
const PROTECTED_ROUTES = [
  "/api/auth/register",
  "/api/auth/password-reset",
  "/api/profile/update",
  "/api/users",
  "/api/quotations",
  "/api/tasks",
  "/api/clients",
  "/api/products",
  "/api/maintenance",
  // Agregar más rutas según sea necesario
];

// Lista de métodos HTTP que requieren verificación CSRF
const PROTECTED_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

/**
 * Verifica si una solicitud requiere protección CSRF
 */
function requiresCSRFProtection(req: NextRequest): boolean {
  const { pathname } = req.nextUrl;
  const method = req.method;

  // Solo verificar métodos que pueden modificar datos
  if (!PROTECTED_METHODS.includes(method)) {
    return false;
  }

  // Verificar si la ruta está en la lista de protegidas
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Middleware para verificar tokens CSRF
 */
export function csrfMiddleware(req: NextRequest) {
  // Verificar si la solicitud requiere protección CSRF
  if (requiresCSRFProtection(req)) {
    // Obtener el token CSRF del encabezado o del cuerpo
    const csrfToken = req.headers.get("X-CSRF-Token");

    // Si no hay token CSRF, rechazar la solicitud
    if (!csrfToken) {
      console.warn(
        `Solicitud rechazada: Token CSRF faltante en ${req.nextUrl.pathname}`
      );
      return NextResponse.json(
        { error: "Token CSRF faltante. Por favor, intenta nuevamente." },
        { status: 403 }
      );
    }

    // Continuar con la solicitud
    return NextResponse.next();
  }

  // Si no requiere protección CSRF, continuar normalmente
  return NextResponse.next();
}