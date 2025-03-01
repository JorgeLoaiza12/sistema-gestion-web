// app/(auth)/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react"; // Importación correcta
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthForm } from "@/components/auth/auth-form";
import { FormField, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ProvidersButtons } from "@/components/auth/providers-buttons";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "CredentialsSignin"
      ? "Credenciales inválidas"
      : null
  );
  const [isLoading, setIsLoading] = useState(false);

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

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setError("Ocurrió un error al intentar iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  }

  const handleGoogleLogin = () => {
    signIn("google", { callbackUrl: "/dashboard" });
  };

  const handleGithubLogin = () => {
    signIn("github", { callbackUrl: "/dashboard" });
  };

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
        footerContent="O continúa con"
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

        <ProvidersButtons
          onGoogleClick={handleGoogleLogin}
          onGithubClick={handleGithubLogin}
          isLoading={isLoading}
        />
      </AuthForm>
    </AuthLayout>
  );
}
