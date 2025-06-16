// services/tasks.ts
import { httpClient } from "@/lib/httpClient";
import { getSession } from "next-auth/react";

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
  state: string;
  types: string[];
  categories: string[];
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
  metadata?: any;
  maintenanceId?: number | null;
}

export interface TaskResponse {
  message: string;
  task: Task;
}

export interface TasksByDateResponse {
  tasks: Task[];
  start?: string;
  end?: string;
}

export interface TasksByDateParams {
  date?: string;
  view?: "daily" | "weekly" | "monthly";
  startDate?: string;
  endDate?: string;
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
  nameWhoReceives?: string;
  positionWhoReceives?: string;
  imageUrlWhoReceives?: string;
}

export interface TaskFilterParams {
  clientId?: string;
  taskType?: string;
  startDate?: string;
  endDate?: string;
  state?: string;
  workerId?: string;
  quotationId?: string;
}

async function getAuthToken(): Promise<string> {
  const session = await import("next-auth/react").then((mod) =>
    mod.getSession()
  );
  return session?.accessToken || "";
}

function ensureWorkersArray(
  workerIds: number | number[] | undefined
): number[] {
  if (!workerIds) {
    return [];
  }
  if (Array.isArray(workerIds)) {
    return workerIds;
  }
  return [workerIds];
}

export async function getAllTasks(filters?: TaskFilterParams): Promise<Task[]> {
  try {
    let url = "/tasks";
    if (filters) {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          queryParams.append(key, String(value));
        }
      });
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }
    }
    return await httpClient<Task[]>(url);
  } catch (error) {
    console.error("Error al obtener todas las tareas:", error);
    throw error;
  }
}

export async function getTasksByDate(
  queryParams: string | TasksByDateParams
): Promise<TasksByDateResponse> {
  try {
    let queryString: string;
    if (typeof queryParams === "string") {
      queryString = queryParams;
    } else {
      const params = new URLSearchParams();
      if (queryParams.startDate)
        params.append("startDate", queryParams.startDate);
      if (queryParams.endDate) params.append("endDate", queryParams.endDate);
      if (queryParams.date && !queryParams.startDate)
        params.append("date", queryParams.date);
      if (queryParams.view) params.append("view", queryParams.view);
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

export async function getWorkerTasks(
  queryParams: string | TasksByDateParams
): Promise<TasksByDateResponse> {
  try {
    let queryString: string;
    if (typeof queryParams === "string") {
      queryString = queryParams;
    } else {
      const params = new URLSearchParams();
      if (queryParams.startDate)
        params.append("startDateQuery", queryParams.startDate);
      if (queryParams.endDate)
        params.append("endDateQuery", queryParams.endDate);
      if (queryParams.date && !queryParams.startDate)
        params.append("date", queryParams.date);
      if (queryParams.view) params.append("view", queryParams.view);
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

export async function createTask(taskData: Task): Promise<TaskResponse> {
  try {
    const processedData = {
      ...taskData,
      quotationId: taskData.quotationId || undefined,
      types: taskData.types || [],
      categories: taskData.categories || [],
      mediaUrls: taskData.mediaUrls || [],
      assignedWorkerIds: ensureWorkersArray(taskData.assignedWorkerIds),
      maintenanceId: taskData.maintenanceId || undefined,
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

export async function updateTask(
  id: string,
  taskData: Task
): Promise<TaskResponse> {
  try {
    const processedData = {
      ...taskData,
      quotationId: taskData.quotationId || undefined,
      types: taskData.types || [],
      categories: taskData.categories || [],
      mediaUrls: taskData.mediaUrls || [],
      assignedWorkerIds: ensureWorkersArray(taskData.assignedWorkerIds),
    };
    if (processedData.client) delete processedData.client;
    if (processedData.quotation) delete processedData.quotation;
    if (processedData.assignedWorkers) delete processedData.assignedWorkers;
    if (processedData.reminderSent) delete processedData.reminderSent;
    if (processedData.createdAt) delete processedData.createdAt;
    if (processedData.updatedAt) delete processedData.updatedAt;

    try {
      return await httpClient<TaskResponse>(`/tasks/${id}`, {
        method: "PUT",
        body: JSON.stringify(processedData),
      });
    } catch (error: any) {
      if (
        error.message &&
        error.message.includes("Forbidden") &&
        (error.message.includes("sendgrid") ||
          error.message.includes("SendGrid"))
      ) {
        console.warn(
          "Error de envío de correo detectado. La tarea se actualizó pero no se pudieron enviar notificaciones."
        );
        try {
          const task = await httpClient<Task>(`/tasks/${id}`);
          return {
            message: "Task updated successfully but email notifications failed",
            task,
          };
        } catch (getError) {
          throw error;
        }
      }
      throw error;
    }
  } catch (error) {
    console.error(`Error al actualizar tarea ${id}:`, error);
    throw error;
  }
}

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

export async function finalizeTask(
  data: FinalizeTaskData
): Promise<TaskResponse> {
  try {
    const processedData = {
      ...data,
      mediaUrls: data.mediaUrls || [],
      systems: data.systems || [],
      technicians: data.technicians || [],
    };
    return await httpClient<TaskResponse>("/tasks/finalize", {
      method: "POST",
      body: JSON.stringify(processedData),
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Forbidden")) {
      console.warn(
        "Advertencia: No se pudo enviar el correo electrónico, pero la tarea fue finalizada"
      );
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
        throw error;
      }
    }
    console.error("Error al finalizar tarea:", error);
    throw error;
  }
}

export async function downloadTaskReport(taskId: string): Promise<Blob> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/tasks/${taskId}/report-pdf`,
      {
        headers: {
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

export async function uploadTaskImageFormData(
  file: File,
  type: string = "work"
): Promise<string> {
  try {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("type", type);
    const session = await import("next-auth/react").then((mod) =>
      mod.getSession()
    );
    const accessToken = session?.accessToken;
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/tasks/upload-image`,
      {
        method: "POST",
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: formData,
      }
    );
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: `Error ${response.status}: ${response.statusText}`,
      }));
      throw new Error(
        errorData.message || `Error al subir imagen: ${response.statusText}`
      );
    }
    const result = await response.json();
    return result.imageUrl;
  } catch (error) {
    console.error("Error al subir imagen de tarea:", error);
    throw error;
  }
}

export async function downloadTasksExcel(
  filters?: TaskFilterParams
): Promise<Blob> {
  try {
    const token = await getAuthToken();
    let url = "/tasks/export/excel";
    const queryParams = new URLSearchParams();
    if (filters) {
      if (filters.clientId) queryParams.append("clientId", filters.clientId);
      if (filters.taskType) queryParams.append("taskType", filters.taskType);
      if (filters.startDate) queryParams.append("startDate", filters.startDate);
      if (filters.endDate) queryParams.append("endDate", filters.endDate);
      if (filters.state && filters.state !== "ALL")
        queryParams.append("state", filters.state);
      if (filters.workerId) queryParams.append("workerId", filters.workerId);
      if (filters.quotationId)
        queryParams.append("quotationId", filters.quotationId);

      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: `Error ${response.status}: ${response.statusText}`,
      }));
      throw new Error(
        errorData.message ||
          `Error al descargar el archivo Excel: ${response.statusText}`
      );
    }
    return response.blob();
  } catch (error) {
    console.error("Error al descargar el archivo Excel de tareas:", error);
    throw error;
  }
}
