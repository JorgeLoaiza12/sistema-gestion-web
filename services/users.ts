import { httpClient } from "@/lib/httpClient";

export interface User {
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "WORKER";
  password?: string;
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
    return await httpClient<UserResponse>("/users", {
      method: "POST",
      body: JSON.stringify(user),
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
    return await httpClient<UserResponse>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(user),
    });
  } catch (error) {
    console.error(`Error al actualizar usuario ${id}:`, error);
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
    return await httpClient<UserResponse>("/users/me", {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  } catch (error) {
    console.error("Error al actualizar perfil de usuario:", error);
    throw error;
  }
}
