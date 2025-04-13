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
    console.log("Obteniendo todos los mantenimientos...");
    const response = await httpClient<Maintenance[]>("/maintenance");
    console.log(`Se encontraron ${response.length} mantenimientos`);
    return response;
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
    console.log(`Obteniendo mantenimiento con ID: ${id}`);
    const response = await httpClient<Maintenance>(`/maintenance/${id}`);
    console.log(`Mantenimiento obtenido: ${JSON.stringify(response, null, 2)}`);
    return response;
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
    console.log(`Obteniendo mantenimientos para cliente ID: ${clientId}`);
    const response = await httpClient<Maintenance[]>(
      `/maintenance/client/${clientId}`
    );
    console.log(
      `Se encontraron ${response.length} mantenimientos para el cliente`
    );
    return response;
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
    console.log(`Obteniendo mantenimientos próximos (${days} días)...`);
    const response = await httpClient<Maintenance[]>(
      `/maintenance/upcoming?days=${days}`
    );
    console.log(`Se encontraron ${response.length} mantenimientos próximos`);
    return response;
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
    console.log("Creando nuevo mantenimiento:", data);
    const response = await httpClient<MaintenanceResponse>("/maintenance", {
      method: "POST",
      body: JSON.stringify(data),
    });
    console.log(`Mantenimiento creado con ID: ${response.maintenance.id}`);
    return response;
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
    console.log(`Actualizando mantenimiento ID: ${id}`, data);
    const response = await httpClient<MaintenanceResponse>(
      `/maintenance/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    );
    console.log(`Mantenimiento actualizado: ${response.message}`);
    return response;
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
    console.log(`Eliminando mantenimiento ID: ${id}`);
    const response = await httpClient<{ message: string }>(
      `/maintenance/${id}`,
      {
        method: "DELETE",
      }
    );
    console.log(`Mantenimiento eliminado: ${response.message}`);
    return response;
  } catch (error) {
    console.error(`Error al eliminar mantenimiento ${id}:`, error);
    throw error;
  }
}

/**
 * Verifica el estado de los mantenimientos atrasados y actualiza sus fechas
 * Esta función sería útil para tests o para actualizar desde el frontend
 */
export async function checkExpiredMaintenances(): Promise<{ updated: number }> {
  try {
    console.log("Verificando mantenimientos vencidos...");
    const response = await httpClient<{ updated: number }>(
      "/maintenance/check-expired",
      {
        method: "POST",
      }
    );
    console.log(`Se actualizaron ${response.updated} mantenimientos vencidos`);
    return response;
  } catch (error) {
    console.error("Error al verificar mantenimientos vencidos:", error);
    throw error;
  }
}

export default {
  getAllMaintenances,
  getMaintenanceById,
  getMaintenancesByClient,
  getUpcomingMaintenances,
  createMaintenance,
  updateMaintenance,
  deleteMaintenance,
  checkExpiredMaintenances,
};
