// services/reports.ts
import { httpClient } from "@/lib/httpClient";
import { getSession } from "next-auth/react";
import { QuotationsParams } from "./quotations";

export interface ReportFilter {
  startDate: string;
  endDate: string;
  clientId?: string;
  status?: string;
  productId?: string;
}

export async function generateCustomReport(filter: ReportFilter) {
  const params = new URLSearchParams();
  params.append("startDate", filter.startDate);
  params.append("endDate", filter.endDate);
  if (filter.clientId) {
    params.append("clientId", filter.clientId);
  }
  if (filter.status) {
    params.append("status", filter.status);
  }
  if (filter.productId) {
    params.append("productId", filter.productId);
  }

  return httpClient(`/reports/custom?${params.toString()}`);
}

export async function downloadReportPDF(filter: ReportFilter) {
  const session = await getSession();
  const token = session?.accessToken || "";

  const params = new URLSearchParams();
  params.append("startDate", filter.startDate);
  params.append("endDate", filter.endDate);
  if (filter.clientId) {
    params.append("clientId", filter.clientId);
  }
  if (filter.status) {
    params.append("status", filter.status);
  }
  if (filter.productId) {
    params.append("productId", filter.productId);
  }

  const response = await fetch(
    `${
      process.env.NEXT_PUBLIC_API_URL
    }/reports/custom/pdf?${params.toString()}`,
    {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );

  if (!response.ok) {
    throw new Error("Error al descargar el reporte");
  }

  return response.blob();
}

export async function downloadReportExcel(filter: ReportFilter) {
  const session = await getSession();
  const token = session?.accessToken || "";

  const params = new URLSearchParams();
  params.append("startDate", filter.startDate);
  params.append("endDate", filter.endDate);
  if (filter.clientId) {
    params.append("clientId", filter.clientId);
  }
  if (filter.status) {
    params.append("status", filter.status);
  }
  if (filter.productId) {
    params.append("productId", filter.productId);
  }

  const response = await fetch(
    `${
      process.env.NEXT_PUBLIC_API_URL
    }/reports/custom/excel?${params.toString()}`,
    {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );

  if (!response.ok) {
    throw new Error("Error al descargar el reporte");
  }

  return response.blob();
}

// Obtener las estadísticas de ventas para el dashboard
export async function getSalesStats(
  period: "week" | "month" | "year" = "month",
  startDate?: string,
  endDate?: string
) {
  try {
    const params = new URLSearchParams();
    params.append("period", period);

    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    console.log("getSalesStats URL params:", params.toString());

    const url = `/reports/sales-stats?${params.toString()}`;
    console.log("Petición URL:", url);

    return httpClient(url);
  } catch (error) {
    console.error("Error en getSalesStats:", error);
    throw error;
  }
}

// Actualización para el servicio getQuotationStats
export async function getQuotationStats(
  params: QuotationsParams = {}
): Promise<any> {
  const queryParams = new URLSearchParams();

  if (params.startDate) queryParams.append("startDate", params.startDate);
  if (params.endDate) queryParams.append("endDate", params.endDate);
  if (params.status) queryParams.append("status", params.status);
  if (params.clientId !== undefined)
    queryParams.append("clientId", params.clientId.toString());

  const queryString = queryParams.toString();
  const url = `/quotations/stats${queryString ? `?${queryString}` : ""}`;

  return httpClient<any>(url);
}

// Obtener las métricas de rendimiento para un trabajador específico
export async function getWorkerPerformance(
  workerId: string,
  startDate: string,
  endDate: string
) {
  const params = new URLSearchParams();
  params.append("startDate", startDate);
  params.append("endDate", endDate);

  return httpClient(
    `/reports/worker-performance/${workerId}?${params.toString()}`
  );
}

// Obtener el historial de cotizaciones y trabajos para un cliente específico
export async function getClientHistory(clientId: string) {
  return httpClient(`/reports/client-history/${clientId}`);
}

// Obtener métricas de productos más vendidos
export async function getTopProducts(
  limit: number = 10,
  startDate?: string,
  endDate?: string
) {
  const params = new URLSearchParams();
  params.append("limit", limit.toString());
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);

  return httpClient(`/reports/top-products?${params.toString()}`);
}
