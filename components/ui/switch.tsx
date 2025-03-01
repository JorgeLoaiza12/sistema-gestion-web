// components/ui/switch.tsx
"use client";

import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

const Switch = React.forwardRef<
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
      className={cn(
        "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent",
        "transition-colors duration-200 ease-in-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
        sizes[size].container,
        className
      )}
      {...props}
      ref={ref}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          "pointer-events-none rounded-full bg-background",
          "shadow-lg ring-0 transition-transform duration-200 ease-in-out",
          "data-[state=checked]:bg-primary-foreground data-[state=unchecked]:bg-content",
          "data-[state=checked]:" + sizes[size].translate,
          sizes[size].thumb
        )}
      />
    </SwitchPrimitives.Root>
  );
});
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
