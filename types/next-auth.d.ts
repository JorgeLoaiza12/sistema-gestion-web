import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      image?: string | null;
    };
    expires: string;
    accessToken?: string; // Añadir esta propiedad
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    image?: string | null;
    emailVerified?: Date | null;
    token?: string; // Añadir esta propiedad
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    name: string;
    role: string;
    image?: string | null;
    accessToken?: string; // Añadir esta propiedad
  }
}