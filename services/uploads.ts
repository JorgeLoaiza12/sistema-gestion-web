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
  file: File, // El archivo ya debería estar comprimido y en formato JPEG/PNG por compressImage
  type: "work" | "who-receives"
): Promise<string> {
  try {
    const formData = new FormData();
    formData.append("image", file); // Enviar el archivo procesado
    formData.append("type", type);

    const session = await getSession();
    const accessToken = session?.accessToken;

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/tasks/upload-image`,
      {
        method: "POST",
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        credentials: "include", // Asegúrate que esto sea necesario y compatible con tu CORS
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

    const data = await response.json();
    return data.imageUrl;
  } catch (error) {
    console.error("Error al subir imagen de tarea:", error);
    throw error;
  }
}

/**
 * Comprime una imagen antes de subirla y la convierte a JPEG.
 * @param file Archivo de imagen original
 * @param maxWidth Ancho máximo en píxeles
 * @param quality Calidad de compresión JPEG (0-1)
 * @returns Archivo comprimido como Blob en formato JPEG
 */
export async function compressImage(
  file: File,
  maxWidth = 1200, // Mantenido como en tu código original
  quality = 0.7 // Calidad para JPEG, 0.7 es un buen compromiso
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      if (!event.target?.result) {
        return reject(new Error("Error al leer el archivo de imagen."));
      }
      img.src = event.target.result as string;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          return reject(new Error("No se pudo crear el contexto de canvas"));
        }

        canvas.width = width;
        canvas.height = height;

        // Dibujar imagen en el canvas (esto la convierte a un formato que el canvas entiende, usualmente PNG/JPEG internamente)
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir a blob como JPEG
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Error al generar blob desde canvas"));
            }
          },
          "image/jpeg", // Forzar la salida a JPEG
          quality
        );
      };

      img.onerror = (error) => {
        console.error("Error al cargar la imagen en el elemento Image:", error);
        reject(
          new Error(
            "Error al cargar la imagen para compresión. Formato podría no ser soportado por el navegador."
          )
        );
      };
    };

    reader.onerror = (error) => {
      console.error("Error en FileReader:", error);
      reject(new Error("Error al leer el archivo de imagen."));
    };
  });
}

/**
 * Crea un archivo File a partir de un Blob.
 * Asegura que el nombre del archivo tenga la extensión .jpeg si se convirtió a JPEG.
 * @param blob Blob de datos
 * @param originalFileName Nombre del archivo original (para obtener la base del nombre)
 * @param options Opciones adicionales
 * @returns Objeto File
 */
export function blobToFile(
  blob: Blob,
  originalFileName: string, // Necesitamos el nombre original para generar uno nuevo
  options?: FilePropertyBag
): File {
  // Generar un nuevo nombre de archivo con extensión .jpeg
  const nameWithoutExtension =
    originalFileName.substring(0, originalFileName.lastIndexOf(".")) ||
    originalFileName;
  const newFileName = `${nameWithoutExtension}.jpeg`;

  return new File([blob], newFileName, {
    // Usar el nuevo nombre con extensión .jpeg
    type: "image/jpeg", // El tipo MIME ahora es image/jpeg
    lastModified: Date.now(),
    ...options,
  });
}
