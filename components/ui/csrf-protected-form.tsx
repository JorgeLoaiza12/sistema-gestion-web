"use client";

import React, {
  FormHTMLAttributes,
  ReactNode,
  useEffect,
  useState,
  forwardRef,
  FormEvent,
} from "react";
import {
  generateCSRFToken,
  storeCSRFToken,
  validateCSRFToken,
} from "@/lib/tokenService";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface CSRFProtectedFormProps extends FormHTMLAttributes<HTMLFormElement> {
  children: ReactNode;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  className?: string;
  submitText?: string;
  isLoading?: boolean;
  error?: string | null;
  showSubmitButton?: boolean;
  submitButtonProps?: {
    type?: "submit" | "button" | "reset";
    disabled?: boolean;
    variant?:
      | "default"
      | "destructive"
      | "outline"
      | "secondary"
      | "ghost"
      | "link";
    size?: "default" | "sm" | "lg" | "icon";
    className?: string;
  };
}

/**
 * Componente de formulario con protección CSRF integrada
 * Genera un token CSRF al montar y lo incluye automáticamente al enviar el formulario
 */
export const CSRFProtectedForm = forwardRef<
  HTMLFormElement,
  CSRFProtectedFormProps
>(
  (
    {
      children,
      onSubmit,
      className,
      submitText = "Guardar",
      isLoading = false,
      error = null,
      showSubmitButton = true,
      submitButtonProps = {},
      ...props
    },
    ref
  ) => {
    const [csrfToken, setCsrfToken] = useState<string>("");

    // Generar un nuevo token CSRF al montar el componente
    useEffect(() => {
      const token = generateCSRFToken();
      setCsrfToken(token);
      storeCSRFToken(token);
    }, []);

    // Manejador de envío con validación CSRF
    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      // Validar que el token del formulario coincida con el almacenado
      if (validateCSRFToken(csrfToken)) {
        // Pasar el evento al manejador proporcionado
        onSubmit(e);
      } else {
        console.error("Error de validación CSRF: Los tokens no coinciden");
        // Podríamos mostrar un mensaje de error o tomar otra acción
        alert(
          "Error de seguridad: Por favor, recarga la página e intenta nuevamente."
        );
      }
    };

    return (
      <form
        onSubmit={handleSubmit}
        className={cn("space-y-6", className)}
        ref={ref}
        {...props}
      >
        {/* Token CSRF oculto */}
        <input type="hidden" name="csrfToken" value={csrfToken} />

        {/* Contenido del formulario */}
        <div className="space-y-4">{children}</div>

        {/* Mensaje de error */}
        {error && (
          <div className="p-3 rounded-lg bg-error/10 border border-error/20">
            <p className="text-sm text-error text-center">{error}</p>
          </div>
        )}

        {/* Botón de envío */}
        {showSubmitButton && (
          <Button
            type="submit"
            disabled={isLoading || submitButtonProps.disabled}
            variant={submitButtonProps.variant || "default"}
            size={submitButtonProps.size || "default"}
            className={cn("w-full", submitButtonProps.className)}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cargando...
              </>
            ) : (
              submitText
            )}
          </Button>
        )}
      </form>
    );
  }
);

CSRFProtectedForm.displayName = "CSRFProtectedForm";
