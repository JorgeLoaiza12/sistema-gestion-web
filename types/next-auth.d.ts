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
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    image?: string | null;
    emailVerified?: Date | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    name: string;
    role: string;
    image?: string | null;
  }
}
