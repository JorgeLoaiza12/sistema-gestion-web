// components/dashboard/header.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X, Menu } from "lucide-react";
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
      </div>
    </header>
  );
}
