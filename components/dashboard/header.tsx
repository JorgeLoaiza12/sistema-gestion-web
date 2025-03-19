// components/dashboard/header.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X, Menu } from "lucide-react";
import { UserNav } from "./user-nav";
import { cn } from "@/lib/utils";

interface HeaderProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  className?: string;
}

export function Header({
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  className,
}: HeaderProps) {
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Evitar hidratación
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-border bg-primary text-primary-foreground backdrop-blur supports-[backdrop-filter]:bg-primary/95",
        className
      )}
    >
      <div className="px-6 flex h-14 w-full items-center">
        {/* Botón de menú móvil */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden hover:text-white hover:bg-primary-hover"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
          <span className="sr-only">Toggle menu</span>
        </Button>

        {/* Logo */}
        <Link
          href="/dashboard"
          className={cn(
            "flex items-between space-x-2 text-primary-foreground hover:text-white",
            showMobileSearch && "hidden md:flex"
          )}
        >
          <span className="font-bold">RG Electronica</span>
        </Link>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          {/* Búsqueda móvil expandida */}
          {showMobileSearch ? (
            <div className="absolute inset-x-0 top-0 bg-background px-4 py-2 md:hidden">
              <div className="relative flex items-center space-x-2">
                <Input
                  type="search"
                  placeholder="Buscar..."
                  className="w-full pl-8"
                />
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowMobileSearch(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Botón de búsqueda móvil */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-primary-foreground hover:bg-primary-hover/20"
                onClick={() => setShowMobileSearch(true)}
              >
                <Search className="h-5 w-5" />
                <span className="sr-only">Buscar</span>
              </Button>

              {/* Búsqueda desktop */}
              <div className="hidden md:block">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-content-subtle" />
                  <Input
                    type="search"
                    placeholder="Buscar..."
                    className="w-[200px] pl-8 bg-white/10 border-white/20 text-primary-foreground placeholder:text-primary-foreground/50 focus:bg-white focus:text-content focus:placeholder:text-content-subtle"
                  />
                </div>
              </div>
            </>
          )}

          {/*  perfil */}
          <div
            className={cn(
              "flex items-center space-x-2",
              showMobileSearch && "hidden md:flex"
            )}
          >
            <UserNav />
          </div>
        </div>
      </div>
    </header>
  );
}
