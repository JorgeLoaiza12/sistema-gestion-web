// app/not-found.tsx (mejorado)
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, Search, ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { logError } from "@/lib/errorHandler";

export default function NotFoundPage() {
  useEffect(() => {
    // Registrar el error 404 para análisis
    logError({
      type: "api/not-found",
      message: `Página no encontrada: ${window.location.pathname}`,
      statusCode: 404,
      timestamp: Date.now(),
      handled: true,
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="text-9xl font-bold text-primary mb-2">404</div>
          <h1 className="text-2xl font-bold text-content-emphasis mb-3">
            Página no encontrada
          </h1>
          <p className="text-content-subtle">
            Lo sentimos, la página que estás buscando no existe o ha sido
            movida.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-3 justify-center">
          <Link href="/dashboard" passHref>
            <Button className="flex items-center justify-center">
              <Home className="mr-2 h-4 w-4" />
              Ir al inicio
            </Button>
          </Link>

          <Button
            variant="outline"
            className="flex items-center justify-center"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver atrás
          </Button>
        </div>

        <div className="mt-8">
          <p className="text-content-subtle text-sm">
            Si crees que esto es un error, por favor contacta a soporte.
          </p>
        </div>
      </div>
    </div>
  );
}
