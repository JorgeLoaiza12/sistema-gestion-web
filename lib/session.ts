// lib/session.ts
import { auth } from "@/auth";

export async function getSession() {
  try {
    const session = await auth();
    return session;
  } catch (error) {
    return null;
  }
}

export async function getCurrentUser() {
  try {
    const session = await getSession();
    return session?.user;
  } catch (error) {
    return null;
  }
}
