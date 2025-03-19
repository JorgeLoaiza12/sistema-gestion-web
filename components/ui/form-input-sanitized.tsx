// components/ui/form-input-sanitized.tsx (mejorado)
"use client";

import React, { useState, useEffect, InputHTMLAttributes } from "react";
import { Input } from "@/components/ui/input";
import {
  FormField,
  FormLabel,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import {
  sanitizeText,
  isValidEmail,
  isValidPhone,
  isValidURL,
  sanitizeSQLInput,
} from "@/lib/inputSanitizer";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

// Tipos de validación disponibles
type ValidationType =
  | "email"
  | "phone"
  | "url"
  | "text"
  | "number"
  | "sql"
  | "custom";

interface FormInputSanitizedProps
  extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
  icon?: LucideIcon;
  validationType?: ValidationType;
  customValidator?: (value: string) => boolean;
  customErrorMessage?: string;
  onSanitizedChange?: (value: string) => void;
  containerClassName?: string;
  fullWidth?: boolean;
  sanitize?: boolean; // Opción para desactivar sanitización en casos específicos
}

/**
 * Componente de entrada con sanitización y validación integrada
 */
export function FormInputSanitized({
  label,
  description,
  icon: Icon,
  validationType = "text",
  customValidator,
  customErrorMessage,
  onSanitizedChange,
  containerClassName,
  fullWidth = false,
  className,
  value,
  onChange,
  onBlur,
  sanitize = true,
  ...props
}: FormInputSanitizedProps) {
  const [inputValue, setInputValue] = useState((value as string) || "");
  const [sanitizedValue, setSanitizedValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  // Actualizar el estado interno cuando cambia el valor externo
  useEffect(() => {
    if (value !== undefined && value !== inputValue) {
      setInputValue(value as string);
      sanitizeAndValidate(value as string);
    }
  }, [value]);

  /**
   * Sanitiza y valida el valor de entrada
   */
  const sanitizeAndValidate = (val: string) => {
    if (!sanitize) {
      setSanitizedValue(val);
      return val;
    }

    // Sanitizar el texto de entrada según el tipo
    let sanitized = val;
    switch (validationType) {
      case "sql":
        sanitized = sanitizeSQLInput(val);
        break;
      case "email":
        // Para email, solo sanitizamos caracteres HTML, no el formato del email
        sanitized = sanitizeText(val);
        break;
      default:
        sanitized = sanitizeText(val);
    }

    setSanitizedValue(sanitized);

    // Si hay una función de cambio externa, llamarla con el valor sanitizado
    if (onSanitizedChange) {
      onSanitizedChange(sanitized);
    }

    // Validar según el tipo especificado
    if (touched) {
      validateInput(sanitized);
    }

    return sanitized;
  };

  /**
   * Valida el valor de entrada según el tipo especificado
   */
  const validateInput = (val: string): boolean => {
    // Si el campo es requerido y está vacío
    if (props.required && !val) {
      setError("Este campo es requerido");
      return false;
    }

    // Si el campo está vacío y no es requerido, no hay error
    if (!val) {
      setError(null);
      return true;
    }

    // Validar según el tipo
    switch (validationType) {
      case "email":
        if (!isValidEmail(val)) {
          setError("Por favor, ingresa un correo electrónico válido");
          return false;
        }
        break;
      case "phone":
        if (!isValidPhone(val)) {
          setError("Por favor, ingresa un número de teléfono válido");
          return false;
        }
        break;
      case "url":
        if (!isValidURL(val)) {
          setError("Por favor, ingresa una URL válida");
          return false;
        }
        break;
      case "number":
        if (isNaN(Number(val))) {
          setError("Por favor, ingresa un número válido");
          return false;
        }
        break;
      case "sql":
        // Validar que no contiene patrones sospechosos de SQL injection
        const suspiciousPatterns =
          /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|UNION|CREATE|EXEC)\b)|(--)|(\/\*)/i;
        if (suspiciousPatterns.test(val)) {
          setError("La entrada contiene caracteres no permitidos");
          return false;
        }
        break;
      case "custom":
        if (customValidator && !customValidator(val)) {
          setError(customErrorMessage || "Entrada no válida");
          return false;
        }
        break;
    }

    // Si pasó todas las validaciones, no hay error
    setError(null);
    return true;
  };

  /**
   * Manejador del evento de cambio
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    const sanitized = sanitizeAndValidate(newValue);

    // Propagar el evento con el valor sanitizado
    if (onChange) {
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: sanitized,
        },
      };
      onChange(syntheticEvent as React.ChangeEvent<HTMLInputElement>);
    }
  };

  /**
   * Manejador del evento de desenfoque
   */
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTouched(true);
    validateInput(sanitizedValue);

    if (onBlur) {
      onBlur(e);
    }
  };

  return (
    <FormField className={containerClassName}>
      {label && (
        <FormLabel>
          <div className="flex items-center gap-2 relative">
            {Icon && <Icon className="h-4 w-4 text-content-subtle" />}
            {label}
          </div>
        </FormLabel>
      )}

      <Input
        className={cn(
          Icon && "pl-8",
          error && "border-error focus:ring-error",
          fullWidth && "w-full",
          className
        )}
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        {...props}
      />

      {description && <FormDescription>{description}</FormDescription>}
      {error && <FormMessage>{error}</FormMessage>}
    </FormField>
  );
}
