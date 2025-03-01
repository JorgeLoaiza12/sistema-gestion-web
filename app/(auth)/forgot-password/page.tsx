// app/(auth)/forgot-password/page.tsx
"use client";

import { useState } from "react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthForm } from "@/components/auth/auth-form";
import { FormField, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    try {
      // Aquí se implementará el envío del correo cuando se tenga el backend
      setSuccess(true);
    } catch (error) {
      setError("Ocurrió un error al intentar enviar el correo");
    }
  }

  if (success) {
    return (
      <AuthLayout
        title="Revisa tu correo"
        subtitle="Te hemos enviado un enlace para restablecer tu contraseña"
      >
        <div className="text-center mt-4">
          <Link
            href="/login"
            className="text-primary hover:text-primary-hover font-medium"
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
      subtitle="Te enviaremos un correo con instrucciones"
    >
      <AuthForm
        onSubmit={handleSubmit}
        error={error}
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
