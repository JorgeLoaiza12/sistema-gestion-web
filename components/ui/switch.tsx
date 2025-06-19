// components/ui/switch.tsx
"use client";

import React, { forwardRef, ElementRef, ComponentPropsWithoutRef } from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

const Switch = forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> & {
    size?: "sm" | "md" | "lg";
  }
>(({ className, size = "md", ...props }, ref) => {
  const sizes = {
    sm: {
      container: "h-5 w-9",
      thumb: "h-3.5 w-3.5",
      translate: "translate-x-4",
    },
    md: {
      container: "h-6 w-11",
      thumb: "h-5 w-5",
      translate: "translate-x-5",
    },
    lg: {
      container: "h-7 w-14",
      thumb: "h-6 w-6",
      translate: "translate-x-7",
    },
  };

  return (
    <SwitchPrimitives.Root
      ref={ref}
      className={cn(
        "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent",
        "transition-colors duration-200 ease-in-out", // Transición para el color de fondo
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-50",
        // Colores del fondo del switch (track)
        "data-[state=checked]:bg-primary", // Rojo de la marca cuando está ENCENDIDO
        "data-[state=unchecked]:bg-gray-300", // Gris claro cuando está APAGADO
        sizes[size].container,
        className
      )}
      {...props}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          "pointer-events-none rounded-full shadow-lg ring-0",
          "transition-transform duration-200 ease-in-out", // Transición para el movimiento del pulgar
          // Colores del selector (thumb/bola)
          "data-[state=checked]:bg-primary-foreground", // Blanco cuando está ENCENDIDO (contrasta con el rojo)
          "data-[state=unchecked]:bg-gray-700", // Gris oscuro cuando está APAGADO (contrasta con el gris claro)
          "data-[state=checked]:" + sizes[size].translate, // Mueve a la derecha cuando está ENCENDIDO
          sizes[size].thumb
        )}
      />
    </SwitchPrimitives.Root>
  );
});
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
