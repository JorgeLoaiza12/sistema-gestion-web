"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  // Manejar la redirección cuando la sesión expira
  useEffect(() => {
    // Establecer un intervalo para comprobar la expiración del token
    const checkSessionInterval = setInterval(async () => {
      try {
        // Obtener el token JWT de localStorage o cookies (dependiendo de la configuración)
        const session = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/session`);
        const data = await session.json();

        // Si no hay sesión y estamos en una ruta protegida (dashboard)
        if (!data.user && pathname.startsWith("/dashboard")) {
          console.log("Sesión expirada, redirigiendo a login");
          router.push("/login");
        }
      } catch (error) {
        console.error("Error verificando sesión:", error);
      }
    }, 10 * 60 * 1000); // Comprobar cada 5 minutos

    return () => clearInterval(checkSessionInterval);
  }, [pathname, router]);

  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
