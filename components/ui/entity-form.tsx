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
  onClose: (e?: React.MouseEvent) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  title: string;
  children: ReactNode;
  isLoading?: boolean;
  error?: string | null;
  footerContent?: ReactNode;
  formClassName?: string;
  maxWidth?: string;
  preventClose?: boolean;
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
  preventClose = false,
}: EntityFormProps) {
  const handleOpenChange = (open: boolean) => {
    if (!open && !preventClose) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className={maxWidth} onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <CSRFProtectedForm
          onSubmit={(e) => {
            e.stopPropagation();
            onSubmit(e);
            return false;
          }}
          className={formClassName}
          isLoading={isLoading}
          error={error}
          showSubmitButton={false} // No mostramos el botón predeterminado para poder personalizarlo en el footer
        >
          {children}

          <DialogFooter className="flex justify-end space-x-2 pt-4">
            {footerContent || (
              <>
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onClose(e);
                  }}
                  type="button"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  onClick={(e) => e.stopPropagation()}
                >
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
