// services/profile.ts
import { httpClient } from "@/lib/httpClient";

export interface ProfileUser {
  id: number;
  email: string;
  name: string;
  phone?: string;
  role: string;
  location?: string;
  company?: string;
  website?: string;
  bio?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProfileResponse {
  message: string;
  user: ProfileUser;
}

export interface ProfileUpdateData {
  name?: string;
  phone?: string;
  location?: string;
  company?: string;
  website?: string;
  bio?: string;
}

export interface PasswordUpdateData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Obtener el perfil del usuario actual
export async function getProfile(): Promise<ProfileUser> {
  try {
    return await httpClient<ProfileUser>("/users/me");
  } catch (error) {
    console.error("Error al obtener perfil de usuario:", error);
    throw error;
  }
}

// Actualizar el perfil del usuario
export async function updateProfile(
  userData: ProfileUpdateData
): Promise<ProfileResponse> {
  try {
    return await httpClient<ProfileResponse>("/users/me", {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  } catch (error) {
    console.error("Error al actualizar perfil de usuario:", error);
    throw error;
  }
}

// Actualizar la contraseña del usuario
export async function updatePassword(
  data: PasswordUpdateData
): Promise<{ message: string }> {
  try {
    return await httpClient<{ message: string }>("/users/me/password", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error("Error al actualizar contraseña:", error);
    throw error;
  }
}

// Subir avatar de usuario
export async function uploadAvatar(file: File): Promise<{ imageUrl: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const session = await import("next-auth/react").then((mod) =>
    mod.getSession()
  );
  const token = session?.accessToken || "";

  // Comprobamos que el archivo sea una imagen y no exceda el tamaño máximo
  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo debe ser una imagen (JPEG, PNG, etc.)");
  }

  if (file.size > 5 * 1024 * 1024) {
    // 5MB
    throw new Error("La imagen no debe exceder los 5MB");
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/upload/avatar`,
    {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Error al subir avatar");
  }

  return response.json();
}
