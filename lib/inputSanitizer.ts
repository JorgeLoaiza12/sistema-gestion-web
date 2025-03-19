// lib/inputSanitizer.ts (mejorado)
/**
 * Utilidades para sanitizar y validar entradas de usuario
 * Estas funciones ayudan a prevenir ataques de inyección y XSS
 */

/**
 * Sanitiza texto general para evitar inyección HTML
 * @param input Texto a sanitizar
 * @returns Texto sanitizado
 */
export function sanitizeText(input: string): string {
  if (!input) return "";

  // Reemplazar caracteres HTML especiales por entidades
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Sanitiza HTML permitiendo solo ciertas etiquetas y atributos seguros
 * @param html HTML a sanitizar
 * @returns HTML sanitizado
 */
export function sanitizeHTML(html: string): string {
  if (!html) return "";

  // Lista de etiquetas HTML permitidas
  const allowedTags = [
    "p",
    "b",
    "i",
    "u",
    "strong",
    "em",
    "a",
    "ul",
    "ol",
    "li",
    "br",
  ];

  // Lista de atributos permitidos por etiqueta
  const allowedAttributes: Record<string, string[]> = {
    a: ["href", "target", "rel"],
    // Añadir más etiquetas y atributos permitidos según sea necesario
  };

  // Eliminar scripts y eventos inline
  let sanitized = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/on\w+='[^']*'/gi, "")
    .replace(/on\w+=\w+/gi, "");

  // Eliminar etiquetas no permitidas y sus contenidos
  allowedTags.forEach((tag) => {
    const regex = new RegExp(`<(?!\/?${tag}\\b)[^>]+>`, "gi");
    sanitized = sanitized.replace(regex, "");
  });

  return sanitized;
}

/**
 * Valida un correo electrónico
 * @param email Correo electrónico a validar
 * @returns true si el correo es válido, false de lo contrario
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Valida un número de teléfono (formato básico)
 * @param phone Número de teléfono a validar
 * @returns true si el número es válido, false de lo contrario
 */
export function isValidPhone(phone: string): boolean {
  // Validación básica, adaptar según los requisitos específicos
  const phoneRegex = /^\+?[0-9]{7,15}$/;
  return phoneRegex.test(phone);
}

/**
 * Valida una URL
 * @param url URL a validar
 * @returns true si la URL es válida, false de lo contrario
 */
export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitiza un nombre de archivo para evitar inyecciones de ruta
 * @param filename Nombre de archivo a sanitizar
 * @returns Nombre de archivo sanitizado
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return "";

  // Eliminar caracteres que podrían usarse para navegación de directorios
  return filename
    .replace(/\.\.\//g, "") // Eliminar ../
    .replace(/\\/g, "") // Eliminar backslashes
    .replace(/\//g, "") // Eliminar forward slashes
    .replace(/~/g, "") // Eliminar tildes
    .replace(/:/g, "") // Eliminar dos puntos
    .replace(/\|/g, "") // Eliminar pipes
    .replace(/\*/g, "") // Eliminar asteriscos
    .replace(/"/g, "") // Eliminar comillas
    .replace(/</g, "") // Eliminar menor que
    .replace(/>/g, "") // Eliminar mayor que
    .replace(/\?/g, "") // Eliminar signos de interrogación
    .trim(); // Eliminar espacios al inicio y final
}

/**
 * Verifica si una contraseña cumple con los requisitos mínimos de seguridad
 * @param password Contraseña a verificar
 * @returns true si la contraseña es segura, false de lo contrario
 */
export function isSecurePassword(password: string): boolean {
  if (!password || password.length < 8) return false;

  // Verificar requisitos mínimos:
  // - Al menos 8 caracteres
  // - Al menos una letra mayúscula
  // - Al menos una letra minúscula
  // - Al menos un número
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);

  return hasUpperCase && hasLowerCase && hasNumbers;
}

/**
 * Sanitiza y valida entrada de JSON para prevenir inyecciones
 * @param jsonInput String que contiene JSON
 * @returns JSON parseado y sanitizado o null si es inválido
 */
export function sanitizeJSON(jsonInput: string): any | null {
  try {
    // Parsear el JSON para verificar que es válido
    const parsed = JSON.parse(jsonInput);

    // Función recursiva para sanitizar todos los strings en el objeto
    const sanitizeObject = (obj: any): any => {
      if (typeof obj === "string") {
        return sanitizeText(obj);
      } else if (Array.isArray(obj)) {
        return obj.map((item) => sanitizeObject(item));
      } else if (obj !== null && typeof obj === "object") {
        const result: any = {};
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            // Sanitizar tanto la clave como el valor
            const sanitizedKey = sanitizeText(key);
            result[sanitizedKey] = sanitizeObject(obj[key]);
          }
        }
        return result;
      }
      return obj;
    };

    return sanitizeObject(parsed);
  } catch (e) {
    console.error("Error parsing JSON:", e);
    return null;
  }
}

/**
 * Sanitiza datos de entrada para prevenir ataques de SQL Injection
 * Nota: Esto debe usarse como una capa adicional de seguridad, no como reemplazo
 * de prepared statements en el backend
 *
 * @param input String a sanitizar
 * @returns String sanitizado
 */
export function sanitizeSQLInput(input: string): string {
  if (!input) return "";

  // Escapar caracteres comunes en SQL injection
  return input
    .replace(/'/g, "''") // Escapar comillas simples
    .replace(/;/g, "") // Remover punto y coma
    .replace(/--/g, "") // Remover comentarios
    .replace(/\/\*/g, "") // Remover inicio de comentario multilínea
    .replace(/\*\//g, ""); // Remover fin de comentario multilínea
}
