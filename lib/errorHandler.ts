// lib/errorHandler.ts (mejorado)
/**
 * Sistema centralizado para manejo de errores de la aplicación
 */

// Tipos de errores que pueden ocurrir en la aplicación
export enum ErrorType {
    // Errores de autenticación
    AUTH_INVALID_CREDENTIALS = "auth/invalid-credentials",
    AUTH_SESSION_EXPIRED = "auth/session-expired",
    AUTH_NOT_AUTHENTICATED = "auth/not-authenticated",
    AUTH_INSUFFICIENT_PERMISSIONS = "auth/insufficient-permissions",
  
    // Errores de API
    API_REQUEST_FAILED = "api/request-failed",
    API_NETWORK_ERROR = "api/network-error",
    API_TIMEOUT = "api/timeout",
    API_SERVER_ERROR = "api/server-error",
    API_NOT_FOUND = "api/not-found",
  
    // Errores de validación
    VALIDATION_REQUIRED_FIELD = "validation/required-field",
    VALIDATION_INVALID_FORMAT = "validation/invalid-format",
    VALIDATION_INVALID_EMAIL = "validation/invalid-email",
    VALIDATION_INVALID_PASSWORD = "validation/invalid-password",
    VALIDATION_PASSWORDS_DONT_MATCH = "validation/passwords-dont-match",
  
    // Errores de datos
    DATA_NOT_FOUND = "data/not-found",
    DATA_ALREADY_EXISTS = "data/already-exists",
    DATA_CORRUPTED = "data/corrupted",
  
    // Errores generales
    UNKNOWN_ERROR = "unknown/error",
    FEATURE_NOT_IMPLEMENTED = "feature/not-implemented",
    OPERATION_CANCELED = "operation/canceled",
    RATE_LIMIT_EXCEEDED = "rate-limit/exceeded",
    
    // Errores de CSRF
    CSRF_TOKEN_MISSING = "csrf/token-missing",
    CSRF_TOKEN_INVALID = "csrf/token-invalid",
    
    // Errores de seguridad
    SECURITY_INVALID_INPUT = "security/invalid-input",
  }
  
  // Interfaz para errores personalizados de la aplicación
  export interface AppError {
    type: ErrorType;
    message: string;
    statusCode?: number;
    details?: any;
    timestamp: number;
    handled: boolean;
    stack?: string;
    source?: string;
  }
  
  // Mapeo de códigos HTTP a tipos de errores
  const HTTP_STATUS_TO_ERROR: Record<number, ErrorType> = {
    400: ErrorType.API_REQUEST_FAILED,
    401: ErrorType.AUTH_SESSION_EXPIRED,
    403: ErrorType.AUTH_INSUFFICIENT_PERMISSIONS,
    404: ErrorType.API_NOT_FOUND,
    408: ErrorType.API_TIMEOUT,
    409: ErrorType.DATA_ALREADY_EXISTS,
    422: ErrorType.VALIDATION_INVALID_FORMAT,
    429: ErrorType.RATE_LIMIT_EXCEEDED,
    500: ErrorType.API_SERVER_ERROR,
    502: ErrorType.API_SERVER_ERROR,
    503: ErrorType.API_SERVER_ERROR,
    504: ErrorType.API_TIMEOUT,
  };
  
  // Mensajes de error predeterminados por tipo
  const ERROR_MESSAGES: Record<ErrorType, string> = {
    [ErrorType.AUTH_INVALID_CREDENTIALS]:
      "Credenciales inválidas. Por favor, verifica tu correo y contraseña.",
    [ErrorType.AUTH_SESSION_EXPIRED]:
      "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
    [ErrorType.AUTH_NOT_AUTHENTICATED]:
      "Debes iniciar sesión para acceder a esta funcionalidad.",
    [ErrorType.AUTH_INSUFFICIENT_PERMISSIONS]:
      "No tienes permisos suficientes para realizar esta acción.",
  
    [ErrorType.API_REQUEST_FAILED]:
      "La solicitud no pudo ser procesada. Por favor, intenta nuevamente.",
    [ErrorType.API_NETWORK_ERROR]:
      "Error de conexión. Verifica tu conexión a internet e intenta nuevamente.",
    [ErrorType.API_TIMEOUT]:
      "La solicitud ha tardado demasiado. Por favor, intenta nuevamente.",
    [ErrorType.API_SERVER_ERROR]:
      "Ha ocurrido un error en el servidor. Nuestro equipo ha sido notificado.",
    [ErrorType.API_NOT_FOUND]:
      "El recurso solicitado no existe o no está disponible.",
  
    [ErrorType.VALIDATION_REQUIRED_FIELD]: "Este campo es obligatorio.",
    [ErrorType.VALIDATION_INVALID_FORMAT]: "El formato ingresado no es válido.",
    [ErrorType.VALIDATION_INVALID_EMAIL]:
      "Por favor, ingresa un correo electrónico válido.",
    [ErrorType.VALIDATION_INVALID_PASSWORD]:
      "La contraseña no cumple con los requisitos de seguridad.",
    [ErrorType.VALIDATION_PASSWORDS_DONT_MATCH]: "Las contraseñas no coinciden.",
  
    [ErrorType.DATA_NOT_FOUND]: "No se encontraron los datos solicitados.",
    [ErrorType.DATA_ALREADY_EXISTS]: "Este registro ya existe en el sistema.",
    [ErrorType.DATA_CORRUPTED]: "Los datos están dañados o son inválidos.",
  
    [ErrorType.UNKNOWN_ERROR]: "Ha ocurrido un error inesperado.",
    [ErrorType.FEATURE_NOT_IMPLEMENTED]:
      "Esta funcionalidad aún no está disponible.",
    [ErrorType.OPERATION_CANCELED]: "La operación ha sido cancelada.",
    [ErrorType.RATE_LIMIT_EXCEEDED]:
      "Has realizado demasiadas solicitudes. Por favor, intenta más tarde.",
      
    [ErrorType.CSRF_TOKEN_MISSING]: 
      "Token de seguridad faltante. Por favor, recarga la página e intenta nuevamente.",
    [ErrorType.CSRF_TOKEN_INVALID]:
      "Token de seguridad inválido. Por favor, recarga la página e intenta nuevamente.",
      
    [ErrorType.SECURITY_INVALID_INPUT]: 
      "La entrada contiene caracteres no permitidos. Por favor, revisa e intenta nuevamente.",
  };
  
  /**
   * Crea un objeto de error de la aplicación a partir de un error nativo o un tipo de error
   * @param error Error nativo o tipo de error
   * @param customMessage Mensaje personalizado opcional
   * @param statusCode Código de estado HTTP opcional
   * @param details Detalles adicionales opcionales
   * @returns Objeto AppError normalizado
   */
  export function createAppError(
    error: Error | ErrorType | string | unknown,
    customMessage?: string,
    statusCode?: number,
    details?: any
  ): AppError {
    let errorType: ErrorType = ErrorType.UNKNOWN_ERROR;
    let errorMessage: string =
      customMessage || ERROR_MESSAGES[ErrorType.UNKNOWN_ERROR];
    let errorStack: string | undefined;
    let errorSource: string | undefined;
  
    // Si es un tipo de error definido, usarlo directamente
    if (
      typeof error === "string" &&
      Object.values(ErrorType).includes(error as ErrorType)
    ) {
      errorType = error as ErrorType;
      errorMessage = customMessage || ERROR_MESSAGES[errorType];
    }
    // Si es un error de respuesta HTTP con código de estado
    else if (statusCode && HTTP_STATUS_TO_ERROR[statusCode]) {
      errorType = HTTP_STATUS_TO_ERROR[statusCode];
      errorMessage = customMessage || ERROR_MESSAGES[errorType];
    }
    // Si es un error nativo
    else if (error instanceof Error) {
      errorMessage = customMessage || error.message;
      errorStack = error.stack;
      errorSource = error.name;
  
      // Intentar detectar errores comunes por el mensaje
      if (
        error.message.includes("network") ||
        error.message.includes("connection")
      ) {
        errorType = ErrorType.API_NETWORK_ERROR;
      } else if (error.message.includes("timeout")) {
        errorType = ErrorType.API_TIMEOUT;
      } else if (error.message.includes("CSRF") || error.message.includes("csrf")) {
        errorType = ErrorType.CSRF_TOKEN_INVALID;
      }
    }
  
    return {
      type: errorType,
      message: errorMessage,
      statusCode,
      details,
      timestamp: Date.now(),
      handled: false,
      stack: errorStack,
      source: errorSource,
    };
  }
  
  /**
   * Registra un error en el sistema (consola, servicio de monitoreo, etc.)
   * @param error Error a registrar
   */
  export function logError(error: AppError | Error | unknown): void {
    // Normalizar a AppError si no lo es
    const appError =
      error instanceof Error && !(error as any).type
        ? createAppError(error)
        : (error as AppError);
  
    // Registrar en consola para desarrollo
    console.error("[ERROR]", appError);
  
    // En producción, aquí se enviaría a un servicio de monitoreo como Sentry
    if (process.env.NODE_ENV === "production") {
      // Implementar integración con servicio de monitoreo
      // Por ejemplo: Sentry.captureException(appError);
      
      // Enviar a un endpoint para registro
      try {
        fetch('/api/log-error', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(appError),
        }).catch(e => console.error('Error sending error to logging endpoint:', e));
      } catch (e) {
        // Silenciar errores al registrar
      }
    }
  
    // Marcar como manejado
    if ((appError as AppError).handled !== undefined) {
      (appError as AppError).handled = true;
    }
    
    // Si es un error de seguridad crítico, registrar de manera más detallada
    if (
      appError.type === ErrorType.CSRF_TOKEN_INVALID ||
      appError.type === ErrorType.SECURITY_INVALID_INPUT
    ) {
      console.error('SECURITY ERROR DETECTED:', {
        ...appError,
        time: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : 'server-side',
      });
    }
  }
  
  /**
   * Determina si un error debe ser reportado al usuario
   * @param error Error a evaluar
   * @returns true si el error debe ser reportado, false de lo contrario
   */
  export function shouldReportErrorToUser(error: AppError): boolean {
    // Errores que no deberían mostrar notificaciones al usuario
    const silentErrors = [
      ErrorType.OPERATION_CANCELED,
      // Añadir más según sea necesario
    ];
  
    return !silentErrors.includes(error.type);
  }
  
  /**
   * Maneja un error, registrándolo y potencialmente notificando al usuario
   * @param error Error a manejar
   * @param notifyUser Función para notificar al usuario
   * @returns El error manejado
   */
  export function handleError(
    error: Error | ErrorType | string | unknown,
    notifyUser?: (message: string, type: "error" | "warning" | "info") => void
  ): AppError {
    // Crear un AppError si no lo es
    const appError =
      error instanceof Error && !(error as any).type
        ? createAppError(error)
        : (error as AppError);
  
    // Registrar el error
    logError(appError);
  
    // Notificar al usuario si es necesario y se proporciona una función
    if (notifyUser && shouldReportErrorToUser(appError)) {
      notifyUser(appError.message, "error");
    }
  
    return appError;
  }