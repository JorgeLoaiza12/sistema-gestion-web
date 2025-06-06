"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useScrollLock } from "@/hooks/useScrollLock"; // Ajusta la ruta según tu estructura

const Dialog = ({ children, open, onOpenChange, ...props }) => {
  // Usar nuestro hook personalizado
  useScrollLock(open);

  return <DialogPrimitive.Root open={open} onOpenChange={onOpenChange} {...props}>{children}</DialogPrimitive.Root>;
};

const DialogTrigger = DialogPrimitive.Trigger;
const DialogClose = DialogPrimitive.Close;

type ExtendedDialogPortalProps = DialogPrimitive.DialogPortalProps & {
  className?: string;
};

const DialogPortal = ({
  children,
  className,
  ...props
}: ExtendedDialogPortalProps) => (
  <DialogPrimitive.Portal {...props}>
    <div className={cn(className)}>{children}</div>
  </DialogPrimitive.Portal>
);
DialogPortal.displayName = "DialogPortal";

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/50",
      "data-[state=open]:animate-fadeIn",
      "data-[state=closed]:animate-fadeOut",
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = "DialogOverlay";

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    className?: string;
    children?: React.ReactNode;
  }
>(({ className, children, ...props }, ref) => {
  // El manejo de scroll ahora está en el componente Dialog con el hook
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed z-50 top-1/2 left-1/2 max-h-[85vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg bg-background p-6 shadow-lg border border-border",
          "data-[state=open]:animate-zoomIn",
          "data-[state=closed]:animate-zoomOut",
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-full p-1 text-content hover:bg-accent hover:text-primary">
          <X className="h-4 w-4" />
          <span className="sr-only">Cerrar</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});
DialogContent.displayName = "DialogContent";

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-bold text-content-emphasis", className)}
    {...props}
  />
));
DialogTitle.displayName = "DialogTitle";

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-content-subtle", className)}
    {...props}
  />
));
DialogDescription.displayName = "DialogDescription";

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
};