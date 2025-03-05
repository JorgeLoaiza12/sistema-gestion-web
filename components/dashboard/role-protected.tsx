// components/dashboard/role-protected.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type Props = {
  children: React.ReactNode;
  allowedRoles?: string[];
};

export function RoleProtected({ children, allowedRoles = [] }: Props) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login");
      return;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(session.user.role)) {
      router.push("/dashboard");
    }
  }, [session, status, router, allowedRoles]);

  if (status === "loading") {
    return <div>Cargando...</div>;
  }

  if (
    !session ||
    (allowedRoles.length > 0 && !allowedRoles.includes(session.user.role))
  ) {
    return null;
  }

  return <>{children}</>;
}
