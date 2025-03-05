// services/products.ts
import { httpClient } from "@/lib/httpClient";
import { getSession } from "next-auth/react";
import { roundUp } from "@/utils/number-format";

export interface Product {
  id?: number | string;
  name: string;
  description?: string;
  unitPrice: number; // Precio unitario/proveedor
  markup: number; // Porcentaje de ganancia (por defecto 35%)
  price: number; // Precio final calculado (unitPrice + markup%)
  categoryId?: number;
  imageUrl?: string; // URL de la imagen del producto
  createdAt?: string;
}

interface ProductResponse {
  message?: string;
  product?: Product;
}

export async function getProducts(): Promise<Product[]> {
  try {
    const response = await httpClient<Product[]>("/products");
    return response;
  } catch (error) {
    console.error("Error al obtener productos:", error);
    throw error;
  }
}

export async function getProductById(id: string): Promise<Product> {
  try {
    const response = await httpClient<Product>(`/products/${id}`);
    return response;
  } catch (error) {
    console.error(`Error al obtener producto ${id}:`, error);
    throw error;
  }
}

// Función auxiliar para manejar envío de FormData con autenticación
async function sendFormDataWithAuth(
  url: string,
  formData: FormData,
  method: string
): Promise<any> {
  const session = await getSession();
  const accessToken = session?.accessToken;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const fullUrl = `${apiUrl}${url}`;

  const response = await fetch(fullUrl, {
    method: method,
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      // No incluimos Content-Type para que el navegador lo establezca automáticamente
    },
    credentials: "include",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Error response body:", errorText);

    let errorMessage;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage =
        errorJson.message ||
        errorJson.error ||
        `Error ${response.status}: ${response.statusText}`;
    } catch (e) {
      errorMessage =
        errorText || `Error ${response.status}: ${response.statusText}`;
    }

    throw new Error(errorMessage);
  }

  return response.json();
}

export async function createProduct(
  product: Product,
  imageFile?: File
): Promise<ProductResponse> {
  // Asegurarse de que se establezca el markup si no se ha definido
  if (product.markup === undefined) {
    product.markup = 35; // 35% por defecto
  }

  // Redondear precio unitario hacia arriba
  product.unitPrice = roundUp(product.unitPrice);

  // Calcular el precio final basado en el precio unitario y el markup
  const markupAmount = Math.ceil((product.unitPrice * product.markup) / 100);
  product.price = product.unitPrice + markupAmount;

  try {
    // Si hay una imagen, usar FormData para enviar tanto los datos como la imagen
    if (imageFile) {
      const formData = new FormData();

      // Agregar todos los campos del producto
      Object.keys(product).forEach((key) => {
        const value = product[key as keyof Product];
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });

      // Agregar el archivo de imagen
      formData.append("file", imageFile);

      // Usar nuestra función auxiliar para enviar FormData
      return await sendFormDataWithAuth("/products", formData, "POST");
    } else {
      // Si no hay imagen, usar el httpClient normal con JSON
      const response = await httpClient<ProductResponse>("/products", {
        method: "POST",
        body: JSON.stringify(product),
      });
      return response;
    }
  } catch (error) {
    console.error("Error al crear producto:", error);
    throw error;
  }
}

export async function updateProduct(
  id: string,
  product: Product,
  imageFile?: File
): Promise<ProductResponse> {
  // Asegurarse de que se establezca el markup si no se ha definido
  if (product.markup === undefined) {
    product.markup = 35; // 35% por defecto
  }

  // Redondear precio unitario hacia arriba
  product.unitPrice = roundUp(product.unitPrice);

  // Calcular el precio final basado en el precio unitario y el markup
  const markupAmount = Math.ceil((product.unitPrice * product.markup) / 100);
  product.price = product.unitPrice + markupAmount;

  try {
    // Si hay una imagen, usar FormData para enviar tanto los datos como la imagen
    if (imageFile) {
      const formData = new FormData();

      // Agregar todos los campos del producto
      Object.keys(product).forEach((key) => {
        const value = product[key as keyof Product];
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });

      // Agregar el archivo de imagen
      formData.append("file", imageFile);

      // Usar nuestra función auxiliar para enviar FormData
      return await sendFormDataWithAuth(`/products/${id}`, formData, "PUT");
    } else {
      // Si no hay imagen, usar el httpClient normal con JSON
      const response = await httpClient<ProductResponse>(`/products/${id}`, {
        method: "PUT",
        body: JSON.stringify(product),
      });
      return response;
    }
  } catch (error) {
    console.error(`Error al actualizar producto ${id}:`, error);
    throw error;
  }
}

export async function deleteProduct(id: string): Promise<{ message: string }> {
  try {
    return await httpClient<{ message: string }>(`/products/${id}`, {
      method: "DELETE",
    });
  } catch (error) {
    console.error(`Error al eliminar producto ${id}:`, error);
    throw error;
  }
}

// Función para subir imágenes
export async function uploadProductImage(
  file: File
): Promise<{ imageUrl: string }> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    // Usar nuestra función auxiliar para enviar FormData
    return await sendFormDataWithAuth(
      "/upload/product-image",
      formData,
      "POST"
    );
  } catch (error) {
    console.error("Error al subir la imagen:", error);
    throw error;
  }
}
