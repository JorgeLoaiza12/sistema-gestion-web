// components/dashboard/sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "next-auth/react";
import { navigation } from "@/config/navigation";

interface SidebarProps {
  className?: string;
  onItemClick?: () => void;
  isCollapsed?: boolean;
  toggleCollapse?: () => void;
}

export function Sidebar({
  className,
  onItemClick,
  isCollapsed,
  toggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role || "WORKER";

  // Filtrar elementos según propiedad requiredRole (si no se define se muestra a todos)
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
  };

  return (
    <div
      className={cn(
        "h-full flex flex-col bg-background border-r border-border",
        className
      )}
    >
      <div className="hidden lg:flex justify-end p-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapse}
          className="shrink-0 text-content-subtle hover:text-primary"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
      <nav className="flex-1 space-y-4 overflow-y-auto">
        {filteredNavigation.map((group) => (
          <div key={group.title} className="px-3">
            {!isCollapsed && (
              <h3 className="mb-2 px-4 text-sm font-semibold tracking-tight text-content-subtle">
                {group.title}
              </h3>
            )}
            <div className="space-y-1">
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onItemClick}
                  className={cn(
                    "group flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    "hover:bg-accent hover:text-primary",
                    pathname === item.href
                      ? "bg-accent text-primary"
                      : "text-content-subtle",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    isCollapsed && "justify-center"
                  )}
                >
                  <div className="flex items-center gap-x-3">
                    <item.icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        pathname === item.href
                          ? "text-primary"
                          : "text-content-subtle group-hover:text-primary"
                      )}
                    />
                    {!isCollapsed && <span>{item.name}</span>}
                  </div>
                  {!isCollapsed && item.badge && (
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

      {/* Botón de cerrar sesión */}
      <div className="mt-auto p-3 border-t border-border">
        <Button
          variant="ghost"
          className={cn(
            "w-full flex items-center justify-start text-content-subtle hover:bg-accent hover:text-error",
            isCollapsed && "justify-center"
          )}
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 shrink-0 mr-2" />
          {!isCollapsed && <span>Cerrar sesión</span>}
        </Button>
      </div>
    </div>
  );
}
