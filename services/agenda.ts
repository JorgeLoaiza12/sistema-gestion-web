// services/task.ts
import { httpClient } from "@/lib/httpClient";

export interface Task {
  id?: number;
  title: string;
  description?: string;
  assignedTo: number;
  startDate: string;
  endDate: string;
  frequency: "DAILY" | "WEEKLY" | "MONTHLY";
}

export async function getTasks() {
  return httpClient("/task");
}

export async function getTaskById(id: string) {
  return httpClient(`/task/${id}`);
}

export async function createTask(task: Task) {
  return httpClient("/task", {
    method: "POST",
    body: JSON.stringify(task),
  });
}

export async function updateTask(id: string, task: Task) {
  return httpClient(`/task/${id}`, {
    method: "PUT",
    body: JSON.stringify(task),
  });
}

export async function deleteTask(id: string) {
  return httpClient(`/task/${id}`, {
    method: "DELETE",
  });
}
