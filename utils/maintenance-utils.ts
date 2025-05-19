// utils/maintenance-utils.ts

/**
 * Calcula la próxima fecha de mantenimiento basada en la fecha actual y la frecuencia
 *
 * @param currentDate - Fecha del último mantenimiento
 * @param frequency - Frecuencia de mantenimiento (MENSUAL, BIMESTRAL, TRIMESTRAL, SEMESTRAL, ANUAL)
 * @returns La fecha calculada para el próximo mantenimiento
 */
export function calculateNextMaintenanceDate(
  currentDate: Date,
  frequency: "MENSUAL" | "BIMESTRAL" | "TRIMESTRAL" | "SEMESTRAL" | "ANUAL"
): Date {
  const nextDate = new Date(currentDate);
  switch (frequency) {
    case "MENSUAL":
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case "BIMESTRAL":
      nextDate.setMonth(nextDate.getMonth() + 2);
      break;
    case "TRIMESTRAL":
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case "SEMESTRAL":
      nextDate.setMonth(nextDate.getMonth() + 6);
      break;
    case "ANUAL":
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    default:
      // Por defecto, usar trimestral
      nextDate.setMonth(nextDate.getMonth() + 3);
  }

  return nextDate;
}

/**
 * Obtiene la etiqueta de estado de un mantenimiento según su fecha
 * @param {Date} nextDate - Fecha del próximo mantenimiento
 * @returns {string} - Estado: overdue, urgent, upcoming, scheduled
 */
export const getMaintenanceStatus = (nextDate) => {
  const now = new Date();
  const maintenanceDate = new Date(nextDate);
  const diffTime = maintenanceDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "overdue"; // Vencido
  if (diffDays <= 7) return "urgent"; // Urgente (próximos 7 días)
  if (diffDays <= 30) return "upcoming"; // Próximo (próximos 30 días)
  return "scheduled"; // Programado (más de 30 días)
};

/**
 * Verifica si un mantenimiento está vencido
 *
 * @param nextMaintenanceDate - Fecha del próximo mantenimiento
 * @returns true si el mantenimiento está vencido
 */
export function isMaintenanceOverdue(
  nextMaintenanceDate: Date | string
): boolean {
  return getMaintenanceStatus(nextMaintenanceDate) === "overdue";
}

/**
 * Verifica si un mantenimiento está urgente (dentro de los próximos 7 días)
 *
 * @param nextMaintenanceDate - Fecha del próximo mantenimiento
 * @returns true si el mantenimiento está en período urgente
 */
export function isMaintenanceUrgent(
  nextMaintenanceDate: Date | string
): boolean {
  return getMaintenanceStatus(nextMaintenanceDate) === "urgent";
}

/**
 * Verifica si un mantenimiento está próximo (dentro de los próximos 30 días)
 *
 * @param nextMaintenanceDate - Fecha del próximo mantenimiento
 * @returns true si el mantenimiento está próximo
 */
export function isMaintenanceUpcoming(
  nextMaintenanceDate: Date | string
): boolean {
  return getMaintenanceStatus(nextMaintenanceDate) === "upcoming";
}

/**
 * Obtiene descripción legible de la frecuencia de mantenimiento
 *
 * @param frequency - Valor de frecuencia (MENSUAL, BIMESTRAL, TRIMESTRAL, SEMESTRAL, ANUAL)
 * @returns Descripción en español de la frecuencia
 */
export function getFrequencyDescription(
  frequency: "MENSUAL" | "BIMESTRAL" | "TRIMESTRAL" | "SEMESTRAL" | "ANUAL"
): string {
  const frequencyMap: Record<string, string> = {
    MENSUAL: "Mensual",
    BIMESTRAL: "Bimestral (cada 2 meses)", // CORREGIDO: Texto descriptivo
    TRIMESTRAL: "Trimestral (cada 3 meses)",
    SEMESTRAL: "Semestral (cada 6 meses)",
    ANUAL: "Anual",
  };
  return frequencyMap[frequency] || frequency;
}

/**
 * Estima el número de mantenimientos en un año según la frecuencia
 *
 * @param frequency - Frecuencia de mantenimiento
 * @returns Número estimado de mantenimientos por año
 */
export function getYearlyMaintenanceCount(
  frequency: "MENSUAL" | "BIMESTRAL" | "TRIMESTRAL" | "SEMESTRAL" | "ANUAL"
): number {
  const countMap: Record<string, number> = {
    MENSUAL: 12,
    BIMESTRAL: 6,
    TRIMESTRAL: 4,
    SEMESTRAL: 2,
    ANUAL: 1,
  };
  return countMap[frequency] || 4; // Por defecto 4 (trimestral)
}
