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
  endDate?: string; //
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
  taskId: number; // [cite: 3493]
  technicalReport: string; // [cite: 3493]
  observations?: string; // [cite: 3493]
  hoursWorked: number; // [cite: 3493]
  mediaUrls?: string[]; // [cite: 3493]
  endDate?: string; // [cite: 3493]
  types?: string[]; // [cite: 3493]
  systems?: string[]; // [cite: 3493]
  technicians?: string[]; // [cite: 3493]
  nameWhoReceives?: string; // [cite: 3493]
  positionWhoReceives?: string; // [cite: 3493]
  imageUrlWhoReceives?: string; // [cite: 3493]
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

function ensureWorkersArray( // [cite: 3494]
  workerIds: number | number[] | undefined
): number[] {
  if (!workerIds) {
    // [cite: 3494]
    return [];
  }
  if (Array.isArray(workerIds)) {
    // [cite: 3494]
    return workerIds;
  }
  return [workerIds]; // [cite: 3494]
}

export async function getAllTasks(filters?: TaskFilterParams): Promise<Task[]> {
  try {
    let url = "/tasks"; //
    if (filters) {
      //
      const queryParams = new URLSearchParams(); //
      Object.entries(filters).forEach(([key, value]) => {
        // [cite: 3495]
        if (value !== undefined && value !== null && value !== "") {
          // [cite: 3495]
          queryParams.append(key, String(value)); // [cite: 3495]
        }
      });
      if (queryParams.toString()) {
        // [cite: 3495]
        url += `?${queryParams.toString()}`; // [cite: 3495]
      }
    }
    return await httpClient<Task[]>(url);
  } catch (error) {
    console.error("Error al obtener todas las tareas:", error); //
    throw error;
  }
}

export async function getTasksByDate( //
  queryParams: string | TasksByDateParams
): Promise<TasksByDateResponse> {
  try {
    let queryString: string; // [cite: 3496]
    if (typeof queryParams === "string") {
      // [cite: 3496]
      queryString = queryParams; // [cite: 3496]
    } else {
      const params = new URLSearchParams(); // [cite: 3496]
      params.append("date", queryParams.date); // [cite: 3496]
      params.append("view", queryParams.view); // [cite: 3496]
      queryString = params.toString(); // [cite: 3496]
    }
    return await httpClient<TasksByDateResponse>( // [cite: 3496]
      `/tasks/by-date?${queryString}`
    );
  } catch (error) {
    console.error("Error al obtener tareas por fecha:", error); //
    throw error;
  }
}

export async function getWorkerTasks( //
  queryParams: string | TasksByDateParams
): Promise<TasksByDateResponse> {
  try {
    let queryString: string; // [cite: 3497]
    if (typeof queryParams === "string") {
      // [cite: 3497]
      queryString = queryParams; // [cite: 3497]
    } else {
      const params = new URLSearchParams(); // [cite: 3497]
      params.append("date", queryParams.date); // [cite: 3497]
      params.append("view", queryParams.view); // [cite: 3497]
      queryString = params.toString(); // [cite: 3497]
    }
    return await httpClient<TasksByDateResponse>( // [cite: 3497]
      `/tasks/worker?${queryString}`
    );
  } catch (error) {
    console.error("Error al obtener tareas del trabajador:", error); //
    throw error;
  }
}

export async function createTask(taskData: Task): Promise<TaskResponse> {
  try {
    const processedData = {
      // [cite: 3498]
      ...taskData, // [cite: 3498]
      quotationId: taskData.quotationId || undefined, // [cite: 3498]
      types: taskData.types || [], // [cite: 3498]
      categories: taskData.categories || [], // [cite: 3498]
      mediaUrls: taskData.mediaUrls || [], // [cite: 3498]
      assignedWorkerIds: ensureWorkersArray(taskData.assignedWorkerIds), // [cite: 3498]
    };
    return await httpClient<TaskResponse>("/tasks", {
      // [cite: 3498]
      method: "POST", // [cite: 3498]
      body: JSON.stringify(processedData), // [cite: 3498]
    });
  } catch (error) {
    console.error("Error al crear tarea:", error); //
    throw error;
  }
}

export async function updateTask( //
  id: string, // [cite: 3499]
  taskData: Task // [cite: 3499]
): Promise<TaskResponse> {
  try {
    const processedData = {
      // [cite: 3499]
      ...taskData, // [cite: 3499]
      quotationId: taskData.quotationId || undefined, // [cite: 3499]
      types: taskData.types || [], // [cite: 3499]
      categories: taskData.categories || [], // [cite: 3499]
      mediaUrls: taskData.mediaUrls || [], // [cite: 3499]
      assignedWorkerIds: ensureWorkersArray(taskData.assignedWorkerIds), // [cite: 3499]
    };
    if (processedData.client) delete processedData.client; //
    if (processedData.quotation) delete processedData.quotation; //
    if (processedData.assignedWorkers) delete processedData.assignedWorkers; //
    if (processedData.reminderSent) delete processedData.reminderSent; //
    if (processedData.createdAt) delete processedData.createdAt; //
    if (processedData.updatedAt) delete processedData.updatedAt; // [cite: 3500]

    try {
      return await httpClient<TaskResponse>(`/tasks/${id}`, {
        //
        method: "PUT", //
        body: JSON.stringify(processedData), //
      });
    } catch (error: any) {
      // [cite: 3500]
      if (
        // [cite: 3500]
        error.message && // [cite: 3500]
        error.message.includes("Forbidden") && // [cite: 3501]
        (error.message.includes("sendgrid") || // [cite: 3501]
          error.message.includes("SendGrid")) // [cite: 3501]
      ) {
        console.warn(
          // [cite: 3501]
          "Error de envío de correo detectado. La tarea se actualizó pero no se pudieron enviar notificaciones." // [cite: 3501]
        );
        try {
          const task = await httpClient<Task>(`/tasks/${id}`); //
          return {
            // [cite: 3502]
            message: "Task updated successfully but email notifications failed", // [cite: 3502]
            task, // [cite: 3502]
          };
        } catch (getError) {
          //
          throw error; //
        }
      }
      throw error; //
    }
  } catch (error) {
    console.error(`Error al actualizar tarea ${id}:`, error); //
    throw error;
  }
}

export async function deleteTask(id: string): Promise<{ message: string }> {
  // [cite: 3503]
  try {
    return await httpClient<{ message: string }>(`/tasks/${id}`, {
      // [cite: 3503]
      method: "DELETE", // [cite: 3503]
    });
  } catch (error) {
    console.error(`Error al eliminar tarea ${id}:`, error); //
    throw error;
  }
}

export async function startTask(taskId: number): Promise<TaskResponse> {
  // [cite: 3504]
  try {
    return await httpClient<TaskResponse>("/tasks/start", {
      // [cite: 3504]
      method: "POST", // [cite: 3504]
      body: JSON.stringify({ taskId }), // [cite: 3504]
    });
  } catch (error) {
    console.error("Error al iniciar tarea:", error); // [cite: 3504]
    throw error; //
  }
}

export async function finalizeTask( //
  data: FinalizeTaskData
): Promise<TaskResponse> {
  try {
    const processedData = {
      //
      ...data, //
      mediaUrls: data.mediaUrls || [], //
      types: data.types || [], //
      systems: data.systems || [], //
      technicians: data.technicians || [], //
    };
    return await httpClient<TaskResponse>("/tasks/finalize", {
      // [cite: 3505]
      method: "POST", // [cite: 3505]
      body: JSON.stringify(processedData), // [cite: 3505]
    });
  } catch (error) {
    // [cite: 3505]
    if (error instanceof Error && error.message.includes("Forbidden")) {
      // [cite: 3505]
      console.warn(
        // [cite: 3506]
        "Advertencia: No se pudo enviar el correo electrónico, pero la tarea fue finalizada" // [cite: 3506]
      );
      try {
        const taskResponse = await httpClient<{ task: Task }>( // [cite: 3506]
          `/tasks/${data.taskId}`, // [cite: 3506]
          {
            // [cite: 3506]
            method: "GET", // [cite: 3506]
          }
        );
        return {
          // [cite: 3506]
          message: "Task finalized successfully but email could not be sent", // [cite: 3507]
          task: taskResponse.task, // [cite: 3507]
        };
      } catch (secondError) {
        // [cite: 3507]
        throw error; // [cite: 3507]
      }
    }
    console.error("Error al finalizar tarea:", error); //
    throw error;
  }
}

export async function downloadTaskReport(taskId: string): Promise<Blob> {
  try {
    const response = await fetch(
      //
      `${process.env.NEXT_PUBLIC_API_URL}/tasks/${taskId}/report-pdf`, //
      {
        //
        headers: {
          //
          Authorization: `Bearer ${await getAuthToken()}`, //
        },
      }
    );
    if (!response.ok) {
      // [cite: 3508]
      throw new Error(`Error al descargar el informe: ${response.statusText}`); // [cite: 3508]
    }
    return response.blob();
  } catch (error) {
    console.error(
      //
      `Error al descargar informe técnico de tarea ${taskId}:`, //
      error
    );
    throw error;
  }
}

export async function uploadTaskImageFormData( //
  file: File, //
  type: string = "work" //
): Promise<string> {
  try {
    const formData = new FormData(); //
    formData.append("image", file); //
    formData.append("type", type); //
    const session = await import("next-auth/react").then(
      (
        mod // [cite: 3509]
      ) => mod.getSession() // [cite: 3509]
    );
    const accessToken = session?.accessToken; //
    const response = await fetch(
      // [cite: 3509]
      `${process.env.NEXT_PUBLIC_API_URL}/tasks/upload-image`, // [cite: 3509]
      {
        // [cite: 3509]
        method: "POST", // [cite: 3509]
        headers: {
          // [cite: 3510]
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}), // [cite: 3510]
        },
        body: formData, // [cite: 3510]
      }
    ); // [cite: 3510]
    if (!response.ok) {
      // [cite: 3510]
      const errorData = await response.json().catch(() => ({
        // [cite: 3510]
        message: `Error ${response.status}: ${response.statusText}`, // [cite: 3510]
      }));
      throw new Error( // [cite: 3510]
        errorData.message || `Error al subir imagen: ${response.statusText}` // [cite: 3510]
      );
    }
    const result = await response.json(); //
    return result.imageUrl;
  } catch (error) {
    console.error("Error al subir imagen de tarea:", error); //
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
      const errorData = await response
        .json()
        .catch(() => ({
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
