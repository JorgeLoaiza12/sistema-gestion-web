// components/dashboard/mobile-sidebar.tsx
"use client";

import { cn } from "@/lib/utils";
import { navigation } from "@/config/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  headerHeight: string;
}

export function MobileSidebar({
  isOpen,
  onClose,
  headerHeight,
}: MobileSidebarProps) {
  const pathname = usePathname();

  // Controlar el scroll del body cuando el sidebar está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    // Cleanup: restaurar el scroll cuando el componente se desmonte
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 lg:hidden transition-opacity duration-300",
          "mt-14", // Espacio para el header
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Sidebar Mobile Container */}
      <div
        className={cn(
          "fixed left-0 z-40 w-64 bg-background transform transition-transform duration-300 ease-in-out lg:hidden",
          "top-14 bottom-0", // Posicionamiento considerando el header
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Contenedor con scroll interno */}
        <div className="h-full flex flex-col">
          {/* Área de navegación scrolleable */}
          <div className="flex-1 overflow-y-auto">
            <nav className="px-3 py-4">
              {navigation.map((group) => (
                <div key={group.title} className="mb-6">
                  <h3 className="px-4 text-sm font-semibold text-muted-foreground mb-2">
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
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-accent/50"
                        )}
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                        <span>{item.name}</span>
                        {item.badge && (
                          <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
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
        </div>
      </div>
    </>
  );
}
