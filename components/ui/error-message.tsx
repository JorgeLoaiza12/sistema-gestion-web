// components/ui/error-message.tsx (mejorado)
"use client";

import { useState } from "react";
import {
  AlertCircle,
  X,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  HelpCircle,
  Shield,
  Database,
  AlertTriangle,
  FileWarning,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ErrorType } from "@/lib/errorHandler";
import { Button } from "@/components/ui/button";

interface ErrorMessageProps {
  type: ErrorType | string;
  message: string;
  details?: string | React.ReactNode;
  statusCode?: number;
  timestamp?: number;
  action?: () => void;
  actionLabel?: string;
  showClose?: boolean;
  onClose?: () => void;
  className?: string;
  severity?: "low" | "medium" | "high" | "critical";
}

/**
 * Componente para mostrar mensajes de error detallados con acciones
 * y la posibilidad de mostrar más información técnica
 */
export function ErrorMessage({
  type,
  message,
  details,
  statusCode,
  timestamp,
  action,
  actionLabel = "Reintentar",
  showClose = true,
  onClose,
  className,
  severity = "medium",
}: ErrorMessageProps) {
  const [expanded, setExpanded] = useState(false);

  // Determinar el estilo según el tipo de error
  const getErrorStyle = (type: string) => {
    if (type.startsWith("auth/")) {
      return "border-orange-400 bg-orange-50 text-orange-700";
    } else if (type.startsWith("api/")) {
      return "border-blue-400 bg-blue-50 text-blue-700";
    } else if (type.startsWith("validation/")) {
      return "border-yellow-400 bg-yellow-50 text-yellow-700";
    } else if (type.startsWith("data/")) {
      return "border-purple-400 bg-purple-50 text-purple-700";
    } else if (type.startsWith("csrf/")) {
      return "border-red-500 bg-red-50 text-red-800";
    } else if (type.startsWith("security/")) {
      return "border-red-600 bg-red-100 text-red-900";
    } else {
      return "border-red-400 bg-red-50 text-red-700";
    }
  };

  // Determinar el título según el tipo de error
  const getErrorTitle = (type: string) => {
    if (type.startsWith("auth/")) {
      return "Error de autenticación";
    } else if (type.startsWith("api/")) {
      return "Error de API";
    } else if (type.startsWith("validation/")) {
      return "Error de validación";
    } else if (type.startsWith("data/")) {
      return "Error de datos";
    } else if (type.startsWith("csrf/")) {
      return "Error de seguridad CSRF";
    } else if (type.startsWith("security/")) {
      return "Error de seguridad";
    } else if (type === "unknown/error") {
      return "Error desconocido";
    } else {
      return "Error";
    }
  };

  // Obtener icono para el tipo de error
  const ErrorIcon = () => {
    if (type.startsWith("auth/")) {
      return <Shield className="h-5 w-5" />;
    } else if (type.startsWith("api/")) {
      return <AlertCircle className="h-5 w-5" />;
    } else if (type.startsWith("validation/")) {
      return <FileWarning className="h-5 w-5" />;
    } else if (type.startsWith("data/")) {
      return <Database className="h-5 w-5" />;
    } else if (type.startsWith("csrf/") || type.startsWith("security/")) {
      return <Shield className="h-5 w-5" />;
    } else {
      return <AlertTriangle className="h-5 w-5" />;
    }
  };

  // Clases para la severidad
  const getSeverityClasses = () => {
    switch (severity) {
      case "low":
        return "border-l-4 border-l-yellow-400";
      case "medium":
        return "border-l-4 border-l-orange-400";
      case "high":
        return "border-l-4 border-l-red-500";
      case "critical":
        return "border-l-4 border-l-red-700 shadow-md";
      default:
        return "border-l-4 border-l-orange-400";
    }
  };

  return (
    <div
      className={cn(
        "rounded-md border p-4 relative",
        getErrorStyle(type),
        getSeverityClasses(),
        className
      )}
    >
      {/* Cabecera del mensaje */}
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          <ErrorIcon />
          <div className="ml-3">
            <h3 className="text-sm font-medium">{getErrorTitle(type)}</h3>
            <div className="mt-1 text-sm">{message}</div>
          </div>
        </div>

        {/* Botón de cierre */}
        {showClose && onClose && (
          <button
            type="button"
            className="ml-auto inline-flex h-6 w-6 items-center justify-center rounded-md"
            onClick={onClose}
            aria-label="Cerrar mensaje de error"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Cerrar</span>
          </button>
        )}
      </div>

      {/* Acciones */}
      <div className="mt-3 flex items-center gap-2">
        {action && (
          <Button
            variant="secondary"
            size="sm"
            onClick={action}
            className="inline-flex items-center"
          >
            <RefreshCw className="mr-2 h-3 w-3" />
            {actionLabel}
          </Button>
        )}

        {details && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center"
          >
            {expanded ? (
              <>
                <ChevronUp className="mr-2 h-3 w-3" />
                Ocultar detalles
              </>
            ) : (
              <>
                <ChevronDown className="mr-2 h-3 w-3" />
                Ver detalles
              </>
            )}
          </Button>
        )}

        {statusCode && (
          <Button
            variant="link"
            size="sm"
            className="ml-auto text-xs text-gray-500"
            asChild
          >
            
              href={`https://developer.mozilla.org/es/docs/Web/HTTP/Status/${statusCode}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <HelpCircle className="mr-1 h-3 w-3" />
              Más información sobre el error {statusCode}
            </a>
          </Button>
        )}
      </div>

      {/* Detalles técnicos (expandibles) */}
      {expanded && details && (
        <div className="mt-3 border-t pt-3 text-sm">
          <h4 className="font-medium mb-1">Detalles técnicos:</h4>
          {typeof details === "string" ? (
            <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
              {details}
            </pre>
          ) : (
            details
          )}

          {timestamp && (
            <div className="mt-2 text-xs text-gray-500">
              Ocurrido el: {new Date(timestamp).toLocaleString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}