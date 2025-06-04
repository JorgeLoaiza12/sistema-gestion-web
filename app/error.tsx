// app/error.tsx
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, RefreshCw } from "lucide-react";
import { logError } from "@/lib/errorHandler";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logError({
      type: "global_error",
      message: error.message,
      details: { stack: error.stack, digest: error.digest },
      timestamp: Date.now(),
      handled: true,
    });
    console.error("Global Error Boundary Caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg border border-error/20 text-center">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-error/10">
          <AlertCircle className="w-8 h-8 text-error" />
        </div>

        <h1 className="text-2xl font-bold mb-4">Algo salió mal</h1>

        <p className="text-content-subtle mb-6">
          Ha ocurrido un error en la aplicación. Nuestro equipo ha sido
          notificado y estamos trabajando para solucionarlo lo antes posible.
        </p>

        {process.env.NODE_ENV !== "production" && (
          <div className="mb-6 p-4 bg-gray-100 rounded overflow-auto text-sm">
            <p className="font-mono font-bold text-error">{error.message}</p>
            {error.stack && (
              <pre className="mt-2 text-xs text-content-subtle text-left whitespace-pre-wrap">
                {error.stack}
              </pre>
            )}
            {error.digest && (
              <p className="mt-2 text-xs text-content-subtle">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => reset()}
            className="flex items-center justify-center"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reintentar
          </Button>

          <Link href="/dashboard" passHref>
            <Button
              variant="outline"
              className="flex items-center justify-center"
            >
              <Home className="mr-2 h-4 w-4" />
              Ir al inicio
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
