// lib/definitions.ts
export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
};

// Extendemos la sesión de NextAuth
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    name: string;
    email: string;
    role: string;
  }
}
