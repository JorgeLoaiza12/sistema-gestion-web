// web/services/uploads.ts
import { httpClient } from "@/lib/httpClient";
import { getSession } from "next-auth/react";

/**
 * Comprime una imagen antes de subirla y la convierte a JPEG.
 * @param file Archivo de imagen original
 * @param maxWidth Ancho máximo en píxeles
 * @param quality Calidad de compresión JPEG (0-1)
 * @returns Archivo comprimido como Blob en formato JPEG
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
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Error al generar blob desde canvas"));
            }
          },
          "image/jpeg",
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
 * @param blob Blob de datos
 * @param originalFileName Nombre del archivo original
 * @returns Objeto File
 */
export function blobToFile(blob: Blob, originalFileName: string): File {
  const nameWithoutExtension =
    originalFileName.substring(0, originalFileName.lastIndexOf(".")) ||
    originalFileName;
  const newFileName = `${nameWithoutExtension}.jpeg`;

  return new File([blob], newFileName, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

/**
 * Sube una imagen para una tarea, comprimiéndola primero.
 * @param file Archivo de imagen a subir
 * @param type Tipo de imagen ('work' o 'who-receives')
 * @returns URL de la imagen subida
 */
export async function uploadTaskImage(
  file: File,
  type: "work" | "who-receives" | "signatures"
): Promise<string> {
  try {
    // Comprimir la imagen antes de subirla
    const compressedBlob = await compressImage(file);
    const compressedFile = blobToFile(compressedBlob, file.name);

    const formData = new FormData();
    formData.append("image", compressedFile);
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
        credentials: "include",
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
