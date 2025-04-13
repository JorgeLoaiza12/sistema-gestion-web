import { httpClient } from "@/lib/httpClient";
import { getSession } from "next-auth/react";
import { roundUp } from "@/utils/number-format";

export interface Product {
  id?: number | string;
  name: string;
  description?: string;
  unitPrice: number;
  markup: number;
  price: number;
  categoryId?: number;
  imageUrl?: string;
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

export const createProduct = async (
  productData: Product | FormData
): Promise<{ message: string; product: Product }> => {
  try {
    if (productData instanceof FormData) {
      // Si es FormData, usar la función auxiliar
      return await sendFormDataWithAuth("/products", productData, "POST");
    } else {
      // Si es un objeto Product, usar httpClient normal
      return await httpClient<{ message: string; product: Product }>(
        "/products",
        {
          method: "POST",
          body: JSON.stringify(productData),
        }
      );
    }
  } catch (error) {
    console.error("Error creating product:", error);
    throw error;
  }
};

export async function updateProduct(
  id: string,
  product: Product | FormData,
  imageFile?: File
): Promise<ProductResponse> {
  try {
    // Si product es FormData, enviarlo directamente
    if (product instanceof FormData) {
      return await sendFormDataWithAuth(`/products/${id}`, product, "PUT");
    }

    // Caso tradicional - manejar object + archivo separado
    // Asegurarse de que se establezca el markup si no se ha definido
    if (product.markup === undefined) {
      product.markup = 35; // 35% por defecto
    }

    // Redondear precio unitario hacia arriba
    product.unitPrice = roundUp(product.unitPrice);

    // Calcular el precio final basado en el precio unitario y el markup
    const markupAmount = Math.ceil((product.unitPrice * product.markup) / 100);
    product.price = product.unitPrice + markupAmount;

    // Si hay una imagen, usar FormData para enviar tanto los datos como la imagen
    if (imageFile) {
      const formData = new FormData();

      // Agregar todos los campos del producto EXCEPTO imageUrl
      Object.keys(product).forEach((key) => {
        // No enviar el campo imageUrl si estamos enviando un archivo
        if (key !== "imageUrl") {
          const value = product[key as keyof Product];
          if (value !== undefined && value !== null) {
            formData.append(key, value.toString());
          }
        }
      });

      // Solo agregar imageUrl si no estamos enviando un archivo nuevo
      if (!imageFile && product.imageUrl) {
        formData.append("imageUrl", product.imageUrl);
      }

      // Agregar el archivo de imagen
      formData.append("image", imageFile);

      console.log("Enviando formData sin imageUrl porque hay archivo nuevo");

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
    formData.append("image", file);

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
