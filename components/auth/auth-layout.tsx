import { AlertCircleIcon, CheckIcon, XIcon } from "lucide-react";
import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row">
      {/* Lado izquierdo - Área de decoración */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-primary p-12 items-center justify-center">
        <div className="relative z-10 text-white max-w-lg">
          <h1 className="text-4xl font-bold mb-6">Bienvenido a RG Electronica</h1>
          <p className="text-lg opacity-90 mb-8">
            Una plataforma para la gestion de tu negocio.
          </p>
        </div>
        {/* Patrón de fondo */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-primary" />
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
        </div>
      </div>

      {/* Lado derecho - Formulario */}
      <div className="flex-1 flex flex-col min-h-screen">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                {title}
              </h2>
              {subtitle && (
                <p className="mt-2 text-sm text-gray-600">{subtitle}</p>
              )}
            </div>
            {children}
          </div>
        </div>
        <footer className="py-4 text-center text-sm text-gray-500">
          © 2024 RG Electronica.
        </footer>
      </div>
    </div>
  );
}
