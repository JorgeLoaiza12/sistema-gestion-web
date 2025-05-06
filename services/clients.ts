import { httpClient } from "@/lib/httpClient";

export interface Client {
  id?: string;
  name: string;
  email: string;
  emailSecondary?: string;
  emailTertiary?: string;
  phone: string;
  rut?: string;
  address?: string;
  commune?: string;
  administrator?: string;
  butler?: string;
  notes?: string;
}

interface ClientResponse {
  message?: string;
  client?: Client;
}

export async function getClients(): Promise<Client[]> {
  try {
    const response = await httpClient<Client[]>("/clients");
    console.log("Clientes obtenidos:", response);
    return response;
  } catch (error) {
    console.error("Error al obtener clientes:", error);
    throw error;
  }
}

export async function getClientById(id: string): Promise<Client> {
  try {
    const response = await httpClient<Client>(`/clients/${id}`);
    return response;
  } catch (error) {
    console.error(`Error al obtener cliente ${id}:`, error);
    throw error;
  }
}

export async function createClient(client: Client): Promise<Client> {
  try {
    const response = await httpClient<ClientResponse>("/clients", {
      method: "POST",
      body: JSON.stringify(client),
    });

    console.log("Respuesta al crear cliente:", response);

    // Si el backend devuelve un objeto con la propiedad 'client', usar ese objeto
    if (response.client) {
      return response.client;
    }

    // Si no, asumir que el backend devolvió directamente el cliente
    return response as unknown as Client;
  } catch (error) {
    console.error("Error al crear cliente:", error);
    throw error;
  }
}

export async function updateClient(
  id: string,
  client: Client
): Promise<Client> {
  try {
    const response = await httpClient<ClientResponse>(`/clients/${id}`, {
      method: "PUT",
      body: JSON.stringify(client),
    });

    // Si el backend devuelve un objeto con la propiedad 'client', usar ese objeto
    if (response.client) {
      return response.client;
    }

    // Si no, asumir que el backend devolvió directamente el cliente
    return response as unknown as Client;
  } catch (error) {
    console.error(`Error al actualizar cliente ${id}:`, error);
    throw error;
  }
}

export async function deleteClient(id: string): Promise<{ message: string }> {
  try {
    return await httpClient<{ message: string }>(`/clients/${id}`, {
      method: "DELETE",
    });
  } catch (error) {
    console.error(`Error al eliminar cliente ${id}:`, error);
    throw error;
  }
}
