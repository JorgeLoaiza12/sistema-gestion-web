// services/serviceReports.ts
import { httpClient } from "@/lib/httpClient";
import { getSession } from "@/lib/session";

export interface ServiceReport {
  id?: number;
  taskId: number;
  description: string;
  hoursWorked: number;
  observations?: string;
  photoUrls?: string[];
}

export async function getServiceReports() {
  return httpClient("/service-reports");
}

export async function getServiceReportById(id: string) {
  return httpClient(`/service-reports/${id}`);
}

export async function createServiceReport(report: ServiceReport) {
  return httpClient("/service-reports", {
    method: "POST",
    body: JSON.stringify(report),
  });
}

export async function updateServiceReport(id: string, report: ServiceReport) {
  return httpClient(`/service-reports/${id}`, {
    method: "PUT",
    body: JSON.stringify(report),
  });
}

export async function deleteServiceReport(id: string) {
  return httpClient(`/service-reports/${id}`, {
    method: "DELETE",
  });
}

export async function uploadReportImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const session = await getSession();
  const token = session?.accessToken || "";

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/upload/report-image`,
    {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error("Error al subir la imagen");
  }

  return response.json();
}
