import { httpClient } from "@/lib/httpClient";
import { getSession } from "next-auth/react";

export interface QuotationItem {
  productId: number;
  quantity: number;
  price?: number;
  total?: number;
  product: {
    id: number;
    name: string;
    price: number;
    markup: number;
    unitPrice: number;
  };
}

export interface QuotationCategory {
  name: string;
  items: QuotationItem[];
}

export interface Quotation {
  id?: string;
  clientId: number;
  title: string;
  description?: string;
  validUntil?: string;
  categories: QuotationCategory[];
  client: {
    id: string;
    name: string;
    email: string;
  };
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  amount?: number; // Para compatibilidad con la vista de tareas
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface QuotationsDataResponse {
  quotations: Quotation[];
  pagination: Pagination;
}

export interface QuotationResponse {
  message: string;
  quotation: Quotation;
}

export interface QuotationsParams {
  page?: number;
  limit?: number;
  search?: string;
  clientId?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
}

// Obtener cotizaciones filtradas y paginadas
export async function getQuotationsData(
  params: QuotationsParams = {}
): Promise<QuotationsDataResponse> {
  const queryParams = new URLSearchParams();

  if (params.page !== undefined)
    queryParams.append("page", params.page.toString());
  if (params.limit !== undefined)
    queryParams.append("limit", params.limit.toString());
  if (params.search) queryParams.append("search", params.search);
  if (params.clientId !== undefined)
    queryParams.append("clientId", params.clientId.toString());
  if (params.status) queryParams.append("status", params.status);
  if (params.startDate) queryParams.append("startDate", params.startDate);
  if (params.endDate) queryParams.append("endDate", params.endDate);

  const queryString = queryParams.toString();
  const url = `/quotations/data${queryString ? `?${queryString}` : ""}`;

  return httpClient<QuotationsDataResponse>(url);
}

export async function getQuotations(): Promise<Quotation[]> {
  return httpClient<Quotation[]>("/quotations");
}

export async function getQuotationsByDateRange(
  startDate: string,
  endDate: string
): Promise<Quotation[]> {
  const queryParams = new URLSearchParams();
  queryParams.append("startDate", startDate);
  queryParams.append("endDate", endDate);

  return httpClient<Quotation[]>(`/quotations?${queryParams.toString()}`);
}

export async function getQuotationById(id: string): Promise<Quotation> {
  return httpClient<Quotation>(`/quotations/${id}`);
}

// Obtener cotizaciones por cliente
export async function getQuotationsByClient(
  clientId: number
): Promise<Quotation[]> {
  try {
    return await httpClient<Quotation[]>(`/quotations/client/${clientId}`);
  } catch (error) {
    console.error(
      `Error al obtener cotizaciones del cliente ${clientId}:`,
      error
    );
    // En caso de error, devolver un array vacío para manejar mejor el error en los componentes
    return [];
  }
}

export async function createQuotation(
  quotation: Quotation
): Promise<QuotationResponse> {
  // Calcular los totales de items con ganancia del 35% antes de enviar
  const calculatedQuotation = {
    ...quotation,
    status: quotation.status || "SENT", // Estado por defecto
    categories: quotation.categories.map((category) => ({
      ...category,
      items: category.items.map((item) => {
        const providerPrice =
          item.price || (item.product ? item.product.price : 0);
        const total = providerPrice * item.quantity;
        return {
          ...item,
          price: providerPrice, // Precio del proveedor
          total: total, // Total sin ganancia (el backend calculará la ganancia)
        };
      }),
    })),
  };

  return httpClient<QuotationResponse>("/quotations", {
    method: "POST",
    body: JSON.stringify(calculatedQuotation),
  });
}

export async function updateQuotation(
  id: string,
  quotation: Quotation
): Promise<QuotationResponse> {
  // Calcular los totales de items con ganancia del 35% antes de enviar
  const calculatedQuotation = {
    ...quotation,
    categories: quotation.categories.map((category) => ({
      ...category,
      items: category.items.map((item) => {
        const providerPrice =
          item.price || (item.product ? item.product.price : 0);
        const total = providerPrice * item.quantity;
        return {
          ...item,
          price: providerPrice, // Precio del proveedor
          total: total, // Total sin ganancia (el backend calculará la ganancia)
        };
      }),
    })),
  };

  return httpClient<QuotationResponse>(`/quotations/${id}`, {
    method: "PUT",
    body: JSON.stringify(calculatedQuotation),
  });
}

export async function deleteQuotation(id: string): Promise<any> {
  return httpClient<{ message: string }>(`/quotations/${id}`, {
    method: "DELETE",
  });
}

export async function updateQuotationStatus(
  id: string,
  status: string
): Promise<QuotationResponse> {
  return httpClient<QuotationResponse>(`/quotations/${id}/status`, {
    method: "PUT", // Cambiado de PATCH a PUT para coincidir con el backend
    body: JSON.stringify({ status }),
  });
}

export async function sendQuotationEmail(
  id: string
): Promise<{ message: string }> {
  return httpClient<{ message: string }>(`/quotations/${id}/send-email`, {
    method: "POST",
  });
}

export async function downloadQuotationPDF(id: string): Promise<Blob> {
  const session = await getSession();
  const token = session?.accessToken || "";

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/quotations/${id}/pdf`,
    {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );

  if (!response.ok) {
    throw new Error("Error al descargar la cotización");
  }

  return response.blob();
}

// Función para obtener estadísticas de cotizaciones
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
