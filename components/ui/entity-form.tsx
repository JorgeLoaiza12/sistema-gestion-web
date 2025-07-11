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
  showSubmitButton?: boolean;
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
  showSubmitButton = true,
}: EntityFormProps) {
  const handleOpenChange = (open: boolean) => {
    if (!open && !preventClose) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className={maxWidth}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <CSRFProtectedForm
          onSubmit={onSubmit}
          className={formClassName}
          isLoading={isLoading}
          error={error}
          showSubmitButton={showSubmitButton}
        >
          {children}

          {footerContent && (
            <DialogFooter className="flex justify-end space-x-2 pt-4">
              {footerContent}
            </DialogFooter>
          )}
        </CSRFProtectedForm>
      </DialogContent>
    </Dialog>
  );
}
