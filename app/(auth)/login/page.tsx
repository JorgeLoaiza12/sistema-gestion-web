"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthForm } from "@/components/auth/auth-form";
import { FormField, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Suspense } from "react";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "CredentialsSignin"
      ? "Credenciales inválidas"
      : null
  );
  const [isLoading, setIsLoading] = useState(false);

  // Redireccionar si ya está autenticado
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  // Checkear callbackUrl para redireccionar después de login exitoso
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Credenciales inválidas");
        setIsLoading(false);
        return;
      }

      // Redireccionar a la URL de callback o al dashboard
      router.push(callbackUrl);
      router.refresh();
    } catch (error) {
      console.error("Error durante el inicio de sesión:", error);
      setError("Ocurrió un error al intentar iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Iniciar sesión"
      subtitle="¡Bienvenido de vuelta! Por favor, ingresa tus credenciales."
    >
      <AuthForm
        onSubmit={handleSubmit}
        error={error}
        isLoading={isLoading}
        submitText="Iniciar sesión"
      >
        <FormField>
          <FormLabel>Correo electrónico</FormLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="tu@email.com"
            disabled={isLoading}
          />
        </FormField>

        <FormField>
          <FormLabel>Contraseña</FormLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            disabled={isLoading}
          />
        </FormField>

        <div className="flex items-center justify-between">
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-primary hover:text-primary-hover"
          >
            ¿Olvidaste tu contraseña?
          </Link>
          <Link
            href="/register"
            className="text-sm font-medium text-primary hover:text-primary-hover"
          >
            Crear cuenta
          </Link>
        </div>
      </AuthForm>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}
