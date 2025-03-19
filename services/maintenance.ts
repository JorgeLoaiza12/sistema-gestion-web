// services/maintenance.ts
import { httpClient } from "@/lib/httpClient";

export interface Maintenance {
  id?: number;
  clientId: number;
  client?: {
    id: number;
    name: string;
    email: string;
    phone?: string;
    address?: string;
  };
  lastMaintenanceDate: string;
  nextMaintenanceDate: string;
  frequency: "MENSUAL" | "TRIMESTRAL" | "SEMESTRAL" | "ANUAL";
  notes?: string;
  taskIds?: number[];
  createdAt?: string;
  updatedAt?: string;
}

export interface MaintenanceResponse {
  message: string;
  maintenance: Maintenance;
}

/**
 * Obtiene todos los mantenimientos
 */
export async function getAllMaintenances(): Promise<Maintenance[]> {
  try {
    return await httpClient<Maintenance[]>("/maintenance");
  } catch (error) {
    console.error("Error al obtener mantenimientos:", error);
    throw error;
  }
}

/**
 * Obtiene un mantenimiento por su ID
 */
export async function getMaintenanceById(id: string): Promise<Maintenance> {
  try {
    return await httpClient<Maintenance>(`/maintenance/${id}`);
  } catch (error) {
    console.error(`Error al obtener mantenimiento ${id}:`, error);
    throw error;
  }
}

/**
 * Obtiene los mantenimientos de un cliente específico
 */
export async function getMaintenancesByClient(
  clientId: string
): Promise<Maintenance[]> {
  try {
    return await httpClient<Maintenance[]>(`/maintenance/client/${clientId}`);
  } catch (error) {
    console.error(
      `Error al obtener mantenimientos del cliente ${clientId}:`,
      error
    );
    throw error;
  }
}

/**
 * Obtiene los mantenimientos próximos en un período de días específico
 */
export async function getUpcomingMaintenances(
  days: number = 30
): Promise<Maintenance[]> {
  try {
    return await httpClient<Maintenance[]>(
      `/maintenance/upcoming?days=${days}`
    );
  } catch (error) {
    console.error(
      `Error al obtener mantenimientos próximos (${days} días):`,
      error
    );
    throw error;
  }
}

/**
 * Crea un nuevo mantenimiento
 */
export async function createMaintenance(
  data: Maintenance
): Promise<MaintenanceResponse> {
  try {
    return await httpClient<MaintenanceResponse>("/maintenance", {
      method: "POST",
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error("Error al crear mantenimiento:", error);
    throw error;
  }
}

/**
 * Actualiza un mantenimiento existente
 */
export async function updateMaintenance(
  id: string,
  data: Maintenance
): Promise<MaintenanceResponse> {
  try {
    return await httpClient<MaintenanceResponse>(`/maintenance/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error(`Error al actualizar mantenimiento ${id}:`, error);
    throw error;
  }
}

/**
 * Elimina un mantenimiento
 */
export async function deleteMaintenance(
  id: string
): Promise<{ message: string }> {
  try {
    return await httpClient<{ message: string }>(`/maintenance/${id}`, {
      method: "DELETE",
    });
  } catch (error) {
    console.error(`Error al eliminar mantenimiento ${id}:`, error);
    throw error;
  }
}
