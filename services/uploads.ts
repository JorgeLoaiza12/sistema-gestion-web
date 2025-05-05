// services/uploads.ts
import { httpClient } from "@/lib/httpClient";
import { getSession } from "next-auth/react";

/**
 * Sube una imagen para una tarea (trabajo realizado o quien recibe)
 * @param file Archivo de imagen a subir
 * @param type Tipo de imagen ('work' o 'who-receives')
 * @returns URL de la imagen subida
 */
export async function uploadTaskImage(
  file: File,
  type: 'work' | 'who-receives'
): Promise<string> {
  try {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("type", type);
    
    // Obtener token manualmente para la petición de FormData
    const session = await getSession();
    const accessToken = session?.accessToken;
    
    // Usar fetch directamente para enviar el FormData
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks/upload-image`, {
      method: "POST",
      headers: {
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
      },
      credentials: "include",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: `Error ${response.status}: ${response.statusText}`
      }));
      
      throw new Error(errorData.message || `Error al subir imagen: ${response.statusText}`);
    }

    const data = await response.json();
    return data.imageUrl;
  } catch (error) {
    console.error("Error al subir imagen de tarea:", error);
    throw error;
  }
}

/**
 * Comprime una imagen antes de subirla
 * @param file Archivo de imagen original
 * @param maxWidth Ancho máximo en píxeles
 * @param quality Calidad de compresión (0-1)
 * @returns Archivo comprimido como Blob
 */
export async function compressImage(
  file: File,
  maxWidth = 1200,
  quality = 0.7
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        // Calcular nueva dimensión manteniendo la proporción
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('No se pudo crear el contexto de canvas'));
          return;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Dibujar imagen en el canvas
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convertir a blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Error al generar blob'));
            }
          },
          file.type,
          quality
        );
      };
      
      img.onerror = () => {
        reject(new Error('Error al cargar la imagen'));
      };
    };
    
    reader.onerror = () => {
      reject(new Error('Error al leer el archivo'));
    };
  });
}

/**
 * Crea un archivo File a partir de un Blob
 * @param blob Blob de datos
 * @param fileName Nombre del archivo
 * @param options Opciones adicionales
 * @returns Objeto File
 */
export function blobToFile(
  blob: Blob,
  fileName: string,
  options?: FilePropertyBag
): File {
  // Crear un nuevo objeto File
  return new File([blob], fileName, {
    type: blob.type,
    lastModified: Date.now(),
    ...options
  });
}