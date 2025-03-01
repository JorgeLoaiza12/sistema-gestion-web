// components/auth/auth-layout.tsx
import { cn } from "@/lib/utils";
import { AlertCircleIcon, CheckIcon, XIcon } from "lucide-react";
import Image from "next/image";
import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  showDemoAlert?: boolean;
}

export function AuthLayout({
  children,
  title,
  subtitle,
  showDemoAlert = true,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row">
      {/* Lado izquierdo - Área de decoración */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-primary p-12 items-center justify-center">
        <div className="relative z-10 text-white max-w-lg">
          <h1 className="text 4xl font-bold mb-6">Bienvenido a SaasStarter</h1>
          <p className="text-lg opacity-90 mb-8">
            Una plataforma moderna y completa para iniciar tu próximo proyecto
            SaaS.
          </p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckIcon className="w-5 h-5" />
              <span>Authentication</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckIcon className="w-5 h-5" />
              <span>Dashboard</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckIcon className="w-5 h-5" />
              <span>User Management</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckIcon className="w-5 h-5" />
              <span>Roles & Permissions</span>
            </div>
          </div>
        </div>
        {/* Patrón de fondo */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-primary" />
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
        </div>
      </div>

      {/* Lado derecho - Formulario */}
      <div className="flex-1 flex flex-col min-h-screen">
        {showDemoAlert && (
          <div className="bg-yellow-50 border-b border-yellow-200">
            <div className="max-w-lg mx-auto py-2 px-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <AlertCircleIcon className="text-yellow-600" />
                <p className="text-sm text-yellow-700">
                  Modo demo: Usa{" "}
                  <span className="font-mono">test@example.com</span> /{" "}
                  <span className="font-mono">test</span>
                </p>
              </div>
              <button className="text-yellow-600 hover:text-yellow-800">
                <XIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
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
          © 2024 SaasStarter. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
