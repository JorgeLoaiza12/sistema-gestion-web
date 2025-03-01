// utils/db.ts
export async function getUserFromDb(email: string, hashedPassword: string) {
  // Para demo: Si el email es "test@example.com" y la contraseña (hasheada) es "test", se retorna el usuario.
  if (email === "test@example.com" && hashedPassword === "test") {
    return {
      id: "1",
      email,
      name: "Usuario de Prueba",
    };
  }
  return null;
}
