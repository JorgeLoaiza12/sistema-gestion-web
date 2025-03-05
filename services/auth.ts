export async function register(name: string, email: string, password: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Error en el registro");
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error en el registro:", error);
    // @ts-ignore
    return { success: false, error: error.message };
  }
}
