"use client";

import { Sidebar } from "@/components/dashboard/sidebar";
import { MobileSidebar } from "@/components/dashboard/mobile-sidebar";
import { Header } from "@/components/dashboard/header";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { SessionMonitor } from "@/components/session-monitor";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { status } = useSession();
  const router = useRouter();

  // Obtener valor de sidebar colapsado de localStorage (solo en cliente)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedState = localStorage.getItem("sidebarCollapsed");
      if (savedState !== null) {
        setIsCollapsed(JSON.parse(savedState));
      }
    }
  }, []);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    // Guardar estado en localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebarCollapsed", JSON.stringify(newState));
    }
  };

  // Redireccionar a login si no hay sesión
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Mostrar pantalla de carga mientras se verifica la sesión
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // No mostrar nada si no está autenticado (mientras se redirecciona)
  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div
      className={cn(
        "min-h-screen flex flex-col",
        isMobileMenuOpen && "h-screen overflow-hidden"
      )}
    >
      {/* Componente para monitorear la sesión */}
      <SessionMonitor />

      {/* Header Fixed */}
      <Header
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        className="h-14"
      />

      <div className="flex-1 flex pt-14">
        {/* Sidebar Desktop - Fixed */}
        <aside
          className={cn(
            "fixed top-14 bottom-0 left-0 z-30",
            "hidden lg:block",
            isCollapsed ? "w-16" : "w-64",
            "border-r border-border bg-background transition-all duration-300"
          )}
        >
          <Sidebar isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} />
        </aside>
        {/* Mobile Sidebar - Considerando el header */}
        <MobileSidebar
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          headerHeight="h-14"
        />
        {/* Main Content - Con overflow-auto para permitir scroll */}
        <main
          className={cn(
            "flex-1",
            "lg:pl-64",
            isCollapsed && "lg:pl-16",
            "overflow-y-auto h-full container p-6" // Añadido para permitir scroll
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
