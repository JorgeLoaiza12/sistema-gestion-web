"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { User } from "@/lib/definitions";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  forgotPassword: (
    email: string
  ) => Promise<{ success: boolean; message: string }>;
  resetPassword: (
    token: string,
    password: string,
    confirmPassword: string
  ) => Promise<{ success: boolean; message: string }>;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const login = async (email: string, password: string) => {
    console.log("email", email);
    console.log("password", password);
    console.log(
      "process.env.NEXT_PUBLIC_API_URL",
      process.env.NEXT_PUBLIC_API_URL
    );
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      console.log("res", res.ok);

      if (res.ok) {
        const data = await res.json();
        console.log("data", data);
        setUser(data.user);
        await router.replace("/dashboard");
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Credenciales inválidas");
      }
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      setError("Ocurrió un error durante el inicio de sesión");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ site: "web" }),
      });
      setUser(null);
      router.replace("/");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/request-password-reset`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
          credentials: "include",
        }
      );

      const data = await res.json();

      if (res.ok) {
        return {
          success: true,
          message:
            "Se ha enviado un enlace de recuperación a tu correo electrónico. Por favor, revisa tu bandeja de entrada.",
        };
      } else {
        setError(data.error || "Error al procesar la solicitud");
        return {
          success: false,
          message:
            data.error ||
            "No se pudo procesar la solicitud. Intenta nuevamente.",
        };
      }
    } catch (error) {
      const message =
        "Error al procesar la solicitud de recuperación de contraseña";
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (
    token: string,
    password: string,
    confirmPassword: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, password, confirmPassword }),
          credentials: "include",
        }
      );

      const data = await res.json();

      if (res.ok) {
        return {
          success: true,
          message:
            "Contraseña actualizada exitosamente. Serás redirigido al inicio de sesión.",
        };
      } else {
        setError(data.error || "Error al restablecer la contraseña");
        return {
          success: false,
          message:
            data.error ||
            "No se pudo restablecer la contraseña. Intenta nuevamente.",
        };
      }
    } catch (error) {
      const message = "Error al restablecer la contraseña";
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        setUser,
        logout,
        forgotPassword,
        resetPassword,
        loading,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return context;
};
