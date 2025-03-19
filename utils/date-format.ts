// utils/date-format.ts

/**
 * Formatea una fecha en un formato específico.
 *
 * @param date - La fecha a formatear
 * @param format - El formato de salida (por defecto: "dd/MM/yyyy")
 * @returns La fecha formateada como string
 *
 * Formatos disponibles:
 * - dd: día con ceros iniciales
 * - MM: mes con ceros iniciales
 * - MMM: nombre corto del mes
 * - MMMM: nombre completo del mes
 * - yyyy: año con 4 dígitos
 * - HH: hora formato 24h con ceros iniciales
 * - mm: minutos con ceros iniciales
 * - ss: segundos con ceros iniciales
 */
export function formatDate(
  date: Date | string | number,
  format: string = "dd/MM/yyyy"
): string {
  const d = new Date(date);

  if (isNaN(d.getTime())) {
    return "Fecha inválida";
  }

  const monthNames = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ];

  const monthShortNames = [
    "ene",
    "feb",
    "mar",
    "abr",
    "may",
    "jun",
    "jul",
    "ago",
    "sep",
    "oct",
    "nov",
    "dic",
  ];

  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const monthShort = monthShortNames[d.getMonth()];
  const monthFull = monthNames[d.getMonth()];
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  const seconds = d.getSeconds().toString().padStart(2, "0");

  return format
    .replace("dd", day)
    .replace("MM", month)
    .replace("MMMM", monthFull)
    .replace("MMM", monthShort)
    .replace("yyyy", year.toString())
    .replace("HH", hours)
    .replace("mm", minutes)
    .replace("ss", seconds);
}

/**
 * Formatea una hora (horas y minutos) desde un objeto Date
 *
 * @param date - La fecha que contiene la hora
 * @returns String formateado como "HH:MM"
 */
export function formatTime(date: Date | string | number): string {
  const d = new Date(date);

  if (isNaN(d.getTime())) {
    return "Hora inválida";
  }

  return `${d.getHours().toString().padStart(2, "0")}:${d
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
}

/**
 * Devuelve el nombre del día de la semana
 *
 * @param date - La fecha
 * @param short - Si se debe devolver el nombre corto (por defecto: false)
 * @returns El nombre del día de la semana
 */
export function getWeekDayName(
  date: Date | string | number,
  short: boolean = false
): string {
  const d = new Date(date);

  if (isNaN(d.getTime())) {
    return "Día inválido";
  }

  const dayNames = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];

  const dayShortNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  if (short) {
    return dayShortNames[d.getDay()];
  }

  return dayNames[d.getDay()];
}

/**
 * Añade días a una fecha
 *
 * @param date - La fecha inicial
 * @param days - El número de días a añadir (puede ser negativo)
 * @returns Una nueva fecha con los días añadidos
 */
export function addDays(date: Date | string | number, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Añade meses a una fecha
 *
 * @param date - La fecha inicial
 * @param months - El número de meses a añadir (puede ser negativo)
 * @returns Una nueva fecha con los meses añadidos
 */
export function addMonths(date: Date | string | number, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

/**
 * Compara dos fechas para saber si son el mismo día
 *
 * @param date1 - Primera fecha
 * @param date2 - Segunda fecha
 * @returns true si las fechas representan el mismo día, false en caso contrario
 */
export function isSameDay(
  date1: Date | string | number,
  date2: Date | string | number
): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);

  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Verifica si una fecha está en el futuro
 *
 * @param date - Fecha a comprobar
 * @returns true si la fecha es posterior a la fecha actual
 */
export function isFutureDate(date: Date | string | number): boolean {
  const d = new Date(date);
  const now = new Date();

  // Resetear horas para comparar solo las fechas
  d.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  return d > now;
}

/**
 * Verifica si una fecha está en el pasado
 *
 * @param date - Fecha a comprobar
 * @returns true si la fecha es anterior a la fecha actual
 */
export function isPastDate(date: Date | string | number): boolean {
  const d = new Date(date);
  const now = new Date();

  // Resetear horas para comparar solo las fechas
  d.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  return d < now;
}

/**
 * Calcula el número de días entre dos fechas
 *
 * @param startDate - Fecha de inicio
 * @param endDate - Fecha de fin
 * @returns Número de días entre las fechas (valor absoluto)
 */
export function daysBetween(
  startDate: Date | string | number,
  endDate: Date | string | number
): number {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Resetear horas para contar días completos
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  // Convertir a milisegundos y calcular la diferencia
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

// ---- NUEVAS FUNCIONES PARA GESTIÓN DE ZONA HORARIA ----

/**
 * Obtiene la fecha actual en formato ISO (YYYY-MM-DD) ajustada a la zona horaria local
 * para evitar problemas con UTC
 *
 * @returns String con la fecha en formato ISO (YYYY-MM-DD)
 */
export function getTodayISOString(): string {
  const today = new Date();
  // Ajustar por zona horaria
  const todayAdjusted = new Date(
    today.getTime() - today.getTimezoneOffset() * 60000
  );
  return todayAdjusted.toISOString().split("T")[0];
}

/**
 * Convierte una cadena ISO (YYYY-MM-DD) a un objeto Date con la fecha correcta
 * independientemente de la zona horaria
 *
 * @param isoDateString - Fecha en formato ISO (YYYY-MM-DD)
 * @returns Objeto Date con la fecha correcta
 */
export function parseISOToDate(isoDateString: string): Date | null {
  if (!isoDateString) return null;

  // Convertir el string de fecha ISO a componentes numéricos
  const [year, month, day] = isoDateString.split("-").map(Number);

  // Si no hay componentes válidos, retornar null
  if (!year || !month || !day) return null;

  // Crear la fecha con año, mes (0-indexado) y día
  // Esto asegura que la fecha es correcta independientemente de la zona horaria
  return new Date(year, month - 1, day);
}

/**
 * Formatea una fecha ISO (YYYY-MM-DD) con el patrón especificado
 * preservando el día correcto independientemente de la zona horaria
 *
 * @param isoDateString - Fecha en formato ISO (YYYY-MM-DD)
 * @param format - Formato de salida (opcional)
 * @returns Fecha formateada según el patrón especificado
 */
export function formatISODate(
  isoDateString: string,
  format: string = "dd/MM/yyyy"
): string {
  if (!isoDateString) return "";

  const date = parseISOToDate(isoDateString);
  if (!date) return "Fecha inválida";

  return formatDate(date, format);
}

/**
 * Formatea una fecha obtenida de una base de datos o API para mostrarla correctamente
 * Es especialmente útil para evitar problemas de zona horaria entre el cliente y el servidor
 *
 * @param dateString - String de fecha que puede incluir información de tiempo (ISO o similar)
 * @param format - Formato de salida deseado
 * @returns Fecha formateada preservando el día correcto
 */
export function formatDateSafely(
  dateString: string | Date,
  format: string = "dd/MM/yyyy"
): string {
  if (!dateString) return "";

  let dateToFormat: Date;

  if (typeof dateString === "string") {
    // Para strings de fecha ISO, extraer solo la parte de la fecha
    const datePart = dateString.split("T")[0];
    const [year, month, day] = datePart.split("-").map(Number);

    // Crear fecha con los componentes específicos para evitar problemas de zona horaria
    dateToFormat = new Date(year, month - 1, day);
  } else {
    // Si ya es un objeto Date, usarlo directamente
    dateToFormat = dateString;
  }

  return formatDate(dateToFormat, format);
}
