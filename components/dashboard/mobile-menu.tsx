// components/dashboard/mobile-menu.tsx
"use client";

import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";

export function MobileMenu() {
  const [open, setOpen] = useState(false);

  // Cerrar el menú cuando la pantalla se hace más grande
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Abrir menú</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[280px] p-0 max-w-[85vw] overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle className="px-6 py-4 text-lg font-semibold">
            Menú
          </SheetTitle>
        </SheetHeader>
        <Sidebar className="w-full" onItemClick={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
