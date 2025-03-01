// app/(dashboard)/layout.tsx
"use client";

import { Sidebar } from "@/components/dashboard/sidebar";
import { MobileSidebar } from "@/components/dashboard/mobile-sidebar";
import { Header } from "@/components/dashboard/header";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={cn(
      "min-h-screen flex flex-col",
      isMobileMenuOpen && "h-screen overflow-hidden"
    )}>
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
        {/* Main Content */}
        <main className={cn("flex-1", "lg:pl-64", isCollapsed && "lg:pl-16")}>
          <div className="container p-6 h-full">{children}</div>
        </main>
      </div>
    </div>
  );
}