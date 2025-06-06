// services/profile.ts
import { httpClient } from "@/lib/httpClient";

export interface ProfileUser {
  id: number;
  email: string;
  name: string;
  phone?: string;
  role: string;
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
  // Convertimos los datos al formato que espera el backend
  const passwordData = {
    currentPassword: data.currentPassword,
    newPassword: data.newPassword,
    confirmPassword: data.confirmPassword,
  };

  try {
    return await httpClient<{ message: string }>("/users/me/password", {
      method: "PUT",
      body: JSON.stringify(passwordData),
    });
  } catch (error) {
    console.error("Error al actualizar contraseña:", error);
    throw error;
  }
}
