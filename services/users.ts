// web/services/users.ts
import { httpClient } from "@/lib/httpClient";

export interface User {
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "WORKER";
  password?: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserResponse {
  message: string;
  user: User;
}

export async function getUsers(): Promise<User[]> {
  try {
    return await httpClient<User[]>("/users");
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    throw error;
  }
}

export async function getUserById(id: string): Promise<User> {
  try {
    return await httpClient<User>(`/users/${id}`);
  } catch (error) {
    console.error(`Error al obtener usuario ${id}:`, error);
    throw error;
  }
}

export async function createUser(user: User): Promise<UserResponse> {
  try {
    const payload: any = { ...user };
    if (!user.password) {
      // El backend ahora lo requiere explícitamente en su schema de creación
      throw new Error("La contraseña es requerida para crear un usuario.");
    }
    return await httpClient<UserResponse>("/users", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("Error al crear usuario:", error);
    throw error;
  }
}

export async function updateUser(
  id: string,
  user: Partial<User>
): Promise<UserResponse> {
  try {
    const { password, ...profileData } = user;
    return await httpClient<UserResponse>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
  } catch (error) {
    console.error(`Error al actualizar usuario ${id}:`, error);
    throw error;
  }
}

export async function adminSetUserPassword(
  userId: string,
  newPassword: string
): Promise<{ message: string }> {
  try {
    return await httpClient<{ message: string }>(`/users/${userId}/password`, {
      method: "PUT",
      body: JSON.stringify({ password: newPassword }),
    });
  } catch (error) {
    console.error(
      `Error al actualizar contraseña para usuario ${userId} por admin:`,
      error
    );
    throw error;
  }
}

export async function deleteUser(id: string): Promise<{ message: string }> {
  try {
    return await httpClient<{ message: string }>(`/users/${id}`, {
      method: "DELETE",
    });
  } catch (error) {
    console.error(`Error al eliminar usuario ${id}:`, error);
    throw error;
  }
}

export async function getUserProfile(): Promise<User> {
  try {
    return await httpClient<User>("/users/me");
  } catch (error) {
    console.error("Error al obtener perfil de usuario:", error);
    throw error;
  }
}

export async function updateUserProfile(
  userData: Partial<User>
): Promise<UserResponse> {
  try {
    const { password, ...profileData } = userData;
    return await httpClient<UserResponse>("/users/me", {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
  } catch (error) {
    console.error("Error al actualizar perfil de usuario:", error);
    throw error;
  }
}
