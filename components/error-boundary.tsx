"use client";

import React, { Component, ReactNode, ErrorInfo } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { logError } from "@/lib/errorHandler";
import Link from "next/link";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * Componente de límite de error que captura errores en la interfaz de usuario
 * y muestra un mensaje de error amigable en lugar de romper la aplicación
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Actualizar el estado para mostrar la UI de error
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Registrar el error para análisis
    logError({ type: 'component_error', message: error.message, details: errorInfo, timestamp: Date.now(), handled: false });
    
    // Guardar el error e información para mostrar en la interfaz
    this.setState({ errorInfo });
  }

  handleReload = (): void => {
    // Recargar la página actual
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Si se ha proporcionado un fallback personalizado, usarlo
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // UI de error predeterminada
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-content">
          <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg border border-error/20">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-error/10">
              <AlertCircle className="w-8 h-8 text-error" />
            </div>
            
            <h2 className="text-2xl font-bold text-center mb-4">Algo salió mal</h2>
            
            <p className="text-content-subtle text-center mb-6">
              Ha ocurrido un error inesperado. Nuestro equipo ha sido notificado y 
              estamos trabajando para solucionarlo lo antes posible.
            </p>
            
            {process.env.NODE_ENV !== 'production' && this.state.error && (
              <div className="mb-6 p-4 bg-gray-100 rounded overflow-auto text-sm">
                <p className="font-mono font-bold text-error">{this.state.error.toString()}</p>
                {this.state.errorInfo && (
                  <pre className="mt-2 text-xs text-content-subtle whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button 
                onClick={this.handleReload}
                className="flex items-center justify-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reintentar
              </Button>
              
              <Link href="/dashboard" passHref>
                <Button 
                  variant="outline"
                  className="flex items-center justify-center"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Ir al inicio
                </Button>
              </Link>
            </div>
          </div>
        </div>
      );
    }

    // Si no hay error, renderizar los hijos normalmente
    return this.props.children;
  }
}

/**
 * Componente de error para páginas específicas
 */
export function PageErrorComponent({ 
  error, 
  reset 
}: { 
  error: Error; 
  reset: () => void;
}) {
  // Registrar el error
  React.useEffect(() => {
    logError({ type: 'page_error', message: error.message, details: error.stack, timestamp: Date.now(), handled: false });
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-content">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg border border-error/20">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-error/10">
          <AlertCircle className="w-8 h-8 text-error" />
        </div>
        
        <h2 className="text-2xl font-bold text-center mb-4">Error al cargar la página</h2>
        
        <p className="text-content-subtle text-center mb-6">
          No pudimos cargar esta página. Por favor, intenta nuevamente o vuelve al inicio.
        </p>
        
        {process.env.NODE_ENV !== 'production' && (
          <div className="mb-6 p-4 bg-gray-100 rounded overflow-auto text-sm">
            <p className="font-mono font-bold text-error">{error.message}</p>
            <pre className="mt-2 text-xs text-content-subtle whitespace-pre-wrap">
              {error.stack}
            </pre>
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button 
            onClick={reset}
            className="flex items-center justify-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reintentar
          </Button>
          
          <Link href="/dashboard" passHref>
            <Button 
              variant="outline"
              className="flex items-center justify-center"
            >
              <Home className="w-4 h-4 mr-2" />
              Ir al inicio
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}