"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useCallback,
} from "react";
import { useNotification } from "@/contexts/NotificationContext";
import {
  logError,
  ErrorType,
  createAppError,
  AppError,
} from "@/lib/errorHandler";

// Definir la estructura del contexto de manejo de errores
interface ErrorContextType {
  // Registrar y mostrar un error genérico
  reportError: (
    error: Error | string | unknown,
    showNotification?: boolean
  ) => void;

  // Registrar y mostrar un error de API
  reportApiError: (error: any, customMessage?: string) => void;

  // Registrar y mostrar un error de validación
  reportValidationError: (message: string) => void;

  // Registrar y mostrar un error de autenticación
  reportAuthError: (message?: string) => void;

  // Obtener información del último error
  lastError: AppError | null;

  // Limpiar el último error
  clearLastError: () => void;
}

// Crear el contexto
const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

/**
 * Proveedor para gestión centralizada de errores
 */
export function ErrorProvider({ children }: { children: ReactNode }) {
  const { addNotification } = useNotification();
  const [lastError, setLastError] = useState<AppError | null>(null);

  /**
   * Registra y muestra un error genérico
   */
  const reportError = useCallback(
    (error: Error | string | unknown, showNotification = true) => {
      const appError = createAppError(error);
      logError(appError);
      setLastError(appError);

      if (showNotification) {
        addNotification("error", appError.message);
      }

      return appError;
    },
    [addNotification]
  );

  /**
   * Registra y muestra un error de API
   */
  const reportApiError = useCallback(
    (error: any, customMessage?: string) => {
      let statusCode: number | undefined;
      let errorMessage = customMessage;

      // Extraer código de estado y mensaje si proviene de una respuesta fetch
      if (error.status || error.statusCode) {
        statusCode = error.status || error.statusCode;
      }

      if (!errorMessage) {
        if (error.message) {
          errorMessage = error.message;
        } else if (error.data && error.data.message) {
          errorMessage = error.data.message;
        }
      }

      const appError = createAppError(error, errorMessage, statusCode);
      logError(appError);
      setLastError(appError);
      addNotification("error", appError.message);

      return appError;
    },
    [addNotification]
  );

  /**
   * Registra y muestra un error de validación
   */
  const reportValidationError = useCallback(
    (message: string) => {
      const appError = createAppError(
        ErrorType.VALIDATION_INVALID_FORMAT,
        message
      );
      logError(appError);
      setLastError(appError);
      addNotification("error", message);

      return appError;
    },
    [addNotification]
  );

  /**
   * Registra y muestra un error de autenticación
   */
  const reportAuthError = useCallback(
    (message?: string) => {
      const appError = createAppError(
        ErrorType.AUTH_SESSION_EXPIRED,
        message || "Tu sesión ha expirado. Por favor, inicia sesión nuevamente."
      );
      logError(appError);
      setLastError(appError);
      addNotification("error", appError.message);

      return appError;
    },
    [addNotification]
  );

  /**
   * Limpia el último error
   */
  const clearLastError = useCallback(() => {
    setLastError(null);
  }, []);

  // Valor del contexto
  const contextValue: ErrorContextType = {
    reportError,
    reportApiError,
    reportValidationError,
    reportAuthError,
    lastError,
    clearLastError,
  };

  return (
    <ErrorContext.Provider value={contextValue}>
      {children}
    </ErrorContext.Provider>
  );
}

/**
 * Hook para usar el contexto de errores
 */
export function useError() {
  const context = useContext(ErrorContext);

  if (context === undefined) {
    throw new Error("useError debe ser usado dentro de un ErrorProvider");
  }

  return context;
}
