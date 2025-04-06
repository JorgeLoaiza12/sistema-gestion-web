"use client";

import { useState } from "react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthForm } from "@/components/auth/auth-form";
import { FormField, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { CheckCircleIcon } from "lucide-react";

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;

    try {
      // Usar la API correcta según tu configuración
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/request-reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al enviar el correo");
      }

      setSuccess(true);
    } catch (error: any) {
      console.error("Error al solicitar recuperación de contraseña:", error);
      setError(
        error.message || "Ocurrió un error al intentar enviar el correo"
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <AuthLayout
        title="Revisa tu correo"
        subtitle="Te hemos enviado un enlace para restablecer tu contraseña"
      >
        <div className="bg-background rounded-xl border border-border p-8 text-center space-y-6">
          <div className="mx-auto w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
            <CheckCircleIcon className="w-6 h-6 text-success" />
          </div>
          <p className="text-sm text-content">
            Si existe una cuenta con ese correo, recibirás instrucciones para
            restablecer tu contraseña.
          </p>
          <Link
            href="/login"
            className="text-primary hover:text-primary-hover font-medium block"
          >
            Volver al inicio de sesión
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Recuperar contraseña"
      subtitle="Te enviaremos un correo con instrucciones para restablecer tu contraseña"
    >
      <AuthForm
        onSubmit={handleSubmit}
        error={error}
        isLoading={isLoading}
        submitText="Enviar instrucciones"
      >
        <FormField>
          <FormLabel htmlFor="email">Correo electrónico</FormLabel>
          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="tu@email.com"
            disabled={isLoading}
          />
        </FormField>

        <div className="text-sm text-center">
          <Link
            href="/login"
            className="text-primary hover:text-primary-hover font-medium"
          >
            Volver al inicio de sesión
          </Link>
        </div>
      </AuthForm>
    </AuthLayout>
  );
}
