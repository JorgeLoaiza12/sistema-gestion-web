"use client";

import React, { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CSRFProtectedForm } from "@/components/ui/csrf-protected-form";

interface EntityFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  title: string;
  children: ReactNode;
  isLoading?: boolean;
  error?: string | null;
  footerContent?: ReactNode;
  formClassName?: string;
  maxWidth?: string;
}

export function EntityForm({
  isOpen,
  onClose,
  onSubmit,
  title,
  children,
  isLoading = false,
  error = null,
  footerContent,
  formClassName,
  maxWidth = "max-w-md",
}: EntityFormProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open: unknown) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className={maxWidth}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <CSRFProtectedForm
          onSubmit={onSubmit}
          className={formClassName}
          isLoading={isLoading}
          error={error}
          showSubmitButton={false} // No mostramos el botón predeterminado para poder personalizarlo en el footer
        >
          {children}

          <DialogFooter className="flex justify-end space-x-2 pt-4">
            {footerContent || (
              <>
                <Button variant="outline" onClick={onClose} type="button">
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Guardando..." : "Guardar"}
                </Button>
              </>
            )}
          </DialogFooter>
        </CSRFProtectedForm>
      </DialogContent>
    </Dialog>
  );
}
