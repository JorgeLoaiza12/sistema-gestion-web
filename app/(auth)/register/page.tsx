// app/(auth)/register/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthForm } from "@/components/auth/auth-form";
import { FormField, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ProvidersButtons } from "@/components/auth/providers-buttons";
import Link from "next/link";
import { signIn } from "@/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    const formData = new FormData(event.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      setIsLoading(false);
      return;
    }

    try {
      // Aquí se implementaría el registro en el backend.
      router.push("/login");
    } catch (error) {
      setError("Ocurrió un error al intentar registrarse");
    } finally {
      setIsLoading(false);
    }
  }

  const handleGoogleRegister = () => {
    signIn("google", { callbackUrl: "/dashboard" });
  };

  const handleGithubRegister = () => {
    signIn("github", { callbackUrl: "/dashboard" });
  };

  return (
    <AuthLayout
      title="Crear cuenta"
      subtitle="¡Bienvenido! Por favor, completa tus datos para comenzar."
      showDemoAlert={false}
    >
      <AuthForm
        onSubmit={handleSubmit}
        error={error}
        isLoading={isLoading}
        submitText="Crear cuenta"
        footerContent="O continúa con"
      >
        <FormField>
          <FormLabel>Nombre completo</FormLabel>
          <Input
            id="name"
            name="name"
            type="text"
            required
            placeholder="John Doe"
            disabled={isLoading}
          />
        </FormField>

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
            autoComplete="new-password"
            required
            placeholder="••••••••"
            disabled={isLoading}
          />
        </FormField>

        <FormField>
          <FormLabel>Confirmar contraseña</FormLabel>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            placeholder="••••••••"
            disabled={isLoading}
          />
        </FormField>

        <div className="flex items-center justify-end">
          <Link
            href="/login"
            className="text-sm font-medium text-primary hover:text-primary-hover"
          >
            ¿Ya tienes una cuenta? Inicia sesión
          </Link>
        </div>

        <ProvidersButtons
          onGoogleClick={handleGoogleRegister}
          onGithubClick={handleGithubRegister}
          isLoading={isLoading}
        />
      </AuthForm>
    </AuthLayout>
  );
}
