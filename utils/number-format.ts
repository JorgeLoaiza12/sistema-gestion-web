/**
 * Formatea un número a moneda CLP (pesos chilenos)
 * - Redondea hacia arriba al entero más cercano
 * - Añade separador de miles con coma
 * - Agrega el símbolo $ al inicio
 *
 * @param value El valor a formatear
 * @returns Cadena formateada (ej: "$1,234,567")
 */
export function formatCurrency(value: number | string): string {
  // Convertir a número si es string
  const numValue = typeof value === "string" ? parseFloat(value) : value;

  // Si no es un número válido, devolver $0
  if (isNaN(numValue)) {
    return "$0";
  }

  // Redondear hacia arriba al entero más cercano
  const roundedValue = Math.ceil(numValue);

  // Formatear con separador de miles
  return "$" + roundedValue.toLocaleString("es-CL");
}

/**
 * Formatea un número con separador de miles
 * - Redondea hacia arriba al entero más cercano
 * - Añade separador de miles con coma
 *
 * @param value El valor a formatear
 * @returns Cadena formateada (ej: "1,234,567")
 */
export function formatNumber(value: number | string): string {
  // Convertir a número si es string
  const numValue = typeof value === "string" ? parseFloat(value) : value;

  // Si no es un número válido, devolver 0
  if (isNaN(numValue)) {
    return "0";
  }

  // Redondear hacia arriba al entero más cercano
  const roundedValue = Math.ceil(numValue);

  // Formatear con separador de miles
  return roundedValue.toLocaleString("es-CL");
}

/**
 * Redondea un número hacia arriba al entero más cercano
 *
 * @param value El valor a redondear
 * @returns Número redondeado hacia arriba
 */
export function roundUp(value: number | string): number {
  // Convertir a número si es string
  const numValue = typeof value === "string" ? parseFloat(value) : value;

  // Si no es un número válido, devolver 0
  if (isNaN(numValue)) {
    return 0;
  }

  // Redondear hacia arriba al entero más cercano
  return Math.ceil(numValue);
}
