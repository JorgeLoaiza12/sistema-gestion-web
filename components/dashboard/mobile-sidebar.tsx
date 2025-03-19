"use client";

import { cn } from "@/lib/utils";
import { navigation } from "@/config/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useScrollLock } from "@/hooks/useScrollLock";
import { useSession, signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  headerHeight?: string;
}

export function MobileSidebar({
  isOpen,
  onClose,
  headerHeight = "h-14",
}: MobileSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Usar nuestro hook personalizado
  useScrollLock(isOpen);

  const userRole = session?.user?.role || "WORKER";

  // Filtrar elementos según el rol del usuario
  const filteredNavigation = navigation
    .map((group) => {
      const items = group.items.filter((item) => {
        if (!item.requiredRole || item.requiredRole === "ALL") return true;
        if (Array.isArray(item.requiredRole)) {
          return item.requiredRole.includes(userRole);
        }
        return item.requiredRole === userRole;
      });
      return { ...group, items };
    })
    .filter((group) => group.items.length > 0);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
    onClose();
  };

  return (
    <>
      {/* Overlay - solo se renderiza si isOpen es true */}
      {isOpen && (
        <div
          className={`fixed inset-0 z-40 bg-black/50 lg:hidden ${headerHeight}`}
          onClick={onClose}
        />
      )}

      {/* Sidebar Mobile Container - siempre se renderiza pero con diferente transformación */}
      <div
        className={cn(
          "fixed left-0 z-40 w-64 bg-background transform transition-transform duration-300 ease-in-out lg:hidden border-r border-border",
          "top-14 bottom-0", // Posicionamiento considerando el header
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Contenedor con scroll interno */}
        <div className="h-full flex flex-col">
          {/* Área de navegación scrolleable */}
          <div className="flex-1 overflow-y-auto">
            <nav className="px-3 py-4">
              {filteredNavigation.map((group) => (
                <div key={group.title} className="mb-6">
                  <h3 className="px-4 text-sm font-semibold text-content-subtle mb-2">
                    {group.title}
                  </h3>
                  <div className="space-y-1">
                    {group.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          "flex items-center gap-x-3 px-4 py-2 text-sm font-medium rounded-md",
                          "transition-colors duration-200",
                          pathname === item.href
                            ? "bg-accent text-primary"
                            : "text-content-subtle hover:bg-accent/50 hover:text-primary"
                        )}
                      >
                        <item.icon
                          className={cn(
                            "h-5 w-5 shrink-0",
                            pathname === item.href
                              ? "text-primary"
                              : "text-content-subtle"
                          )}
                        />
                        <span>{item.name}</span>
                        {item.badge && (
                          <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground font-bold">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </div>

          {/* Botón de cerrar sesión */}
          <div className="mt-auto p-4 border-t border-border">
            <Button
              variant="ghost"
              className="w-full flex items-center justify-start text-content-subtle hover:bg-accent hover:text-error"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span>Cerrar sesión</span>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
