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
  quotationId?: number;
  clientId?: number;
  state: string; // Valores: "PENDIENTE", "EN_CURSO", "FINALIZADO"
  types: string[]; // Ej: ["REVISION", "REPARACION", "MANTENCION"]
  categories: string[]; // Ej: ["CCTV", "Citofonia", "cerco electrico", ...]
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
  };
  quotation?: {
    id: number;
    title: string;
    amount: number;
  };
}

export interface TaskResponse {
  message: string;
  task: Task;
}

export interface TasksByDateParams {
  date: string;
  view: "daily" | "weekly" | "monthly";
}

export interface TasksByDateResponse {
  tasks: Task[];
  start: string;
  end: string;
}

export interface FinalizeTaskData {
  taskId: number;
  technicalReport: string;
  observations?: string;
  hoursWorked: number;
  mediaUrls?: string[];
  endDate?: string;
}

// Obtener todas las tareas
export async function getAllTasks(): Promise<Task[]> {
  try {
    return await httpClient<Task[]>("/tasks");
  } catch (error) {
    console.error("Error al obtener todas las tareas:", error);
    throw error;
  }
}

// Obtener tareas por fecha y vista (diaria, semanal, mensual)
export async function getTasksByDate(
  params: TasksByDateParams
): Promise<TasksByDateResponse> {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append("date", params.date);
    queryParams.append("view", params.view);

    return await httpClient<TasksByDateResponse>(
      `/tasks/by-date?${queryParams.toString()}`
    );
  } catch (error) {
    console.error("Error al obtener tareas por fecha:", error);
    throw error;
  }
}

// Crear una nueva tarea
export async function createTask(taskData: Task): Promise<TaskResponse> {
  try {
    return await httpClient<TaskResponse>("/tasks", {
      method: "POST",
      body: JSON.stringify(taskData),
    });
  } catch (error) {
    console.error("Error al crear tarea:", error);
    throw error;
  }
}

// Actualizar una tarea existente
export async function updateTask(
  id: string,
  taskData: Task
): Promise<TaskResponse> {
  try {
    return await httpClient<TaskResponse>(`/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(taskData),
    });
  } catch (error) {
    console.error(`Error al actualizar tarea ${id}:`, error);
    throw error;
  }
}

// Eliminar una tarea
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

// Finalizar una tarea
export async function finalizeTask(
  data: FinalizeTaskData
): Promise<TaskResponse> {
  try {
    return await httpClient<TaskResponse>("/tasks/finalize", {
      method: "POST",
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error("Error al finalizar tarea:", error);
    throw error;
  }
}
