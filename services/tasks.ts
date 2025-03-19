// services/tasks.ts
import { httpClient } from "@/lib/httpClient";

export interface TaskAssignment {
  taskId: number;
  workerId: number;
  worker: {
    id: number;
    name: string;
    email: string;
  };
}

export interface Task {
  id?: number;
  title: string;
  description?: string;
  quotationId?: number | null;
  clientId?: number;
  state: string; // Valores: "PENDIENTE", "EN_CURSO", "FINALIZADO"
  types: string[]; // Ej: ["REVISION", "REPARACION", "MANTENCION"]
  categories: string[]; // Ej: ["CCTV", "Citofonia", "Cerco eléctrico", ...]
  technicalReport?: string;
  observations?: string;
  hoursWorked?: number;
  mediaUrls?: string[];
  startDate: string;
  endDate?: string;
  assignedWorkerIds?: number[];
  assignedWorkers?: TaskAssignment[];
  client?: {
    id: number;
    name: string;
    email: string;
    phone?: string;
    rut?: string;
    address?: string;
    commune?: string;
    administrator?: string;
    butler?: string;
  };
  quotation?: {
    id: number;
    title: string;
    amount: number;
  };
  reminderSent?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskResponse {
  message: string;
  task: Task;
}

export interface TasksByDateResponse {
  tasks: Task[];
  start: string;
  end: string;
}

export interface TasksByDateParams {
  date: string;
  view: "daily" | "weekly" | "monthly";
}

export interface FinalizeTaskData {
  taskId: number;
  technicalReport: string;
  observations?: string;
  hoursWorked: number;
  mediaUrls?: string[];
  endDate?: string;
  types?: string[];
  systems?: string[];
  technicians?: string[];
}

// Función auxiliar para obtener el token de autenticación
async function getAuthToken(): Promise<string> {
  const session = await import("next-auth/react").then((mod) =>
    mod.getSession()
  );
  return session?.accessToken || "";
}

/**
 * Obtiene todas las tareas
 */
export async function getAllTasks(): Promise<Task[]> {
  try {
    return await httpClient<Task[]>("/tasks");
  } catch (error) {
    console.error("Error al obtener todas las tareas:", error);
    throw error;
  }
}

/**
 * Obtiene tareas por fecha y vista (diaria, semanal, mensual)
 * @param queryParams - Parámetros de consulta como string o objeto de parámetros
 */
export async function getTasksByDate(
  queryParams: string | TasksByDateParams
): Promise<TasksByDateResponse> {
  try {
    let queryString: string;

    if (typeof queryParams === "string") {
      queryString = queryParams;
    } else {
      const params = new URLSearchParams();
      params.append("date", queryParams.date);
      params.append("view", queryParams.view);
      queryString = params.toString();
    }

    return await httpClient<TasksByDateResponse>(
      `/tasks/by-date?${queryString}`
    );
  } catch (error) {
    console.error("Error al obtener tareas por fecha:", error);
    throw error;
  }
}

/**
 * Obtiene las tareas asignadas al trabajador actual
 * @param queryParams - Parámetros de consulta como string o objeto
 */
export async function getWorkerTasks(
  queryParams: string | TasksByDateParams
): Promise<TasksByDateResponse> {
  try {
    let queryString: string;

    if (typeof queryParams === "string") {
      queryString = queryParams;
    } else {
      const params = new URLSearchParams();
      params.append("date", queryParams.date);
      params.append("view", queryParams.view);
      queryString = params.toString();
    }

    return await httpClient<TasksByDateResponse>(
      `/tasks/worker?${queryString}`
    );
  } catch (error) {
    console.error("Error al obtener tareas del trabajador:", error);
    throw error;
  }
}

/**
 * Crea una nueva tarea
 */
export async function createTask(taskData: Task): Promise<TaskResponse> {
  try {
    // Preprocesamiento de datos para evitar problemas con valores nulos
    const processedData = {
      ...taskData,
      // Si quotationId es null, lo convertimos a undefined para que no se envíe
      quotationId: taskData.quotationId || undefined,
      // Asegurar que se envíen arrays vacíos en lugar de null
      types: taskData.types || [],
      categories: taskData.categories || [],
      mediaUrls: taskData.mediaUrls || [],
      assignedWorkerIds: taskData.assignedWorkerIds || [],
    };

    return await httpClient<TaskResponse>("/tasks", {
      method: "POST",
      body: JSON.stringify(processedData),
    });
  } catch (error) {
    console.error("Error al crear tarea:", error);
    throw error;
  }
}

/**
 * Actualiza una tarea existente
 */
export async function updateTask(
  id: string,
  taskData: Task
): Promise<TaskResponse> {
  try {
    // Preprocesamos los datos para manejar valores nulos y evitar errores de validación
    const processedData = {
      ...taskData,
      // Si quotationId es null, lo convertimos a undefined para que no se envíe
      quotationId: taskData.quotationId || undefined,
      // Asegurar que se envíen arrays vacíos en lugar de null
      types: taskData.types || [],
      categories: taskData.categories || [],
      mediaUrls: taskData.mediaUrls || [],
      assignedWorkerIds: taskData.assignedWorkerIds || [],
    };

    // Eliminar propiedades que no deberían enviarse al backend
    if (processedData.client) delete processedData.client;
    if (processedData.quotation) delete processedData.quotation;
    if (processedData.assignedWorkers) delete processedData.assignedWorkers;
    if (processedData.reminderSent) delete processedData.reminderSent;
    if (processedData.createdAt) delete processedData.createdAt;
    if (processedData.updatedAt) delete processedData.updatedAt;

    console.log("Datos procesados para actualizar:", processedData);

    try {
      return await httpClient<TaskResponse>(`/tasks/${id}`, {
        method: "PUT",
        body: JSON.stringify(processedData),
      });
    } catch (error: any) {
      // Si el error contiene "Forbidden" y está relacionado con SendGrid
      if (
        error.message &&
        error.message.includes("Forbidden") &&
        (error.message.includes("sendgrid") ||
          error.message.includes("SendGrid"))
      ) {
        console.warn(
          "Error de envío de correo detectado. La tarea se actualizó pero no se pudieron enviar notificaciones."
        );

        // Intentar recuperar los datos de la tarea actualizada a pesar del error de correo
        try {
          const task = await httpClient<Task>(`/tasks/${id}`);
          return {
            message: "Task updated successfully but email notifications failed",
            task,
          };
        } catch (getError) {
          // Si también falla al obtener la tarea actualizada, lanzar el error original
          throw error;
        }
      }

      // Para cualquier otro tipo de error, propagarlo normalmente
      throw error;
    }
  } catch (error) {
    console.error(`Error al actualizar tarea ${id}:`, error);
    throw error;
  }
}

/**
 * Elimina una tarea
 */
export async function deleteTask(id: string): Promise<{ message: string }> {
  try {
    return await httpClient<{ message: string }>(`/tasks/${id}`, {
      method: "DELETE",
    });
  } catch (error) {
    console.error(`Error al eliminar tarea ${id}:`, error);
    throw error;
  }
}

/**
 * Inicia una tarea (cambia el estado de PENDIENTE a EN_CURSO)
 */
export async function startTask(taskId: number): Promise<TaskResponse> {
  try {
    return await httpClient<TaskResponse>("/tasks/start", {
      method: "POST",
      body: JSON.stringify({ taskId }),
    });
  } catch (error) {
    console.error("Error al iniciar tarea:", error);
    throw error;
  }
}

/**
 * Finaliza una tarea
 */
export async function finalizeTask(
  data: FinalizeTaskData
): Promise<TaskResponse> {
  try {
    // Asegurar que los arrays estén definidos
    const processedData = {
      ...data,
      mediaUrls: data.mediaUrls || [],
      types: data.types || [],
      systems: data.systems || [],
      technicians: data.technicians || [],
    };

    return await httpClient<TaskResponse>("/tasks/finalize", {
      method: "POST",
      body: JSON.stringify(processedData),
    });
  } catch (error) {
    // Capturar específicamente el error de correo (403 Forbidden de SendGrid)
    if (error instanceof Error && error.message.includes("Forbidden")) {
      console.warn(
        "Advertencia: No se pudo enviar el correo electrónico, pero la tarea fue finalizada"
      );
      // Podríamos intentar obtener la tarea actualizada
      try {
        const taskResponse = await httpClient<{ task: Task }>(
          `/tasks/${data.taskId}`,
          {
            method: "GET",
          }
        );
        return {
          message: "Task finalized successfully but email could not be sent",
          task: taskResponse.task,
        };
      } catch (secondError) {
        // Si también falla la recuperación de la tarea, lanzamos el error original
        throw error;
      }
    }
    console.error("Error al finalizar tarea:", error);
    throw error;
  }
}

/**
 * Descarga el PDF del informe técnico de una tarea finalizada
 */
export async function downloadTaskReport(taskId: string): Promise<Blob> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/tasks/${taskId}/report-pdf`,
      {
        headers: {
          // Incluir token de autenticación
          Authorization: `Bearer ${await getAuthToken()}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Error al descargar el informe: ${response.statusText}`);
    }

    return response.blob();
  } catch (error) {
    console.error(
      `Error al descargar informe técnico de tarea ${taskId}:`,
      error
    );
    throw error;
  }
}
