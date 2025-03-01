"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthForm } from "@/components/auth/auth-form";
import { FormField, FormLabel, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { CheckCircleIcon, XCircleIcon } from "lucide-react";
import Link from "next/link";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Validar token (ejemplo simple)
  const token = searchParams.get("token");
  const isValidToken = token?.length === 32;

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
      // Simulación de delay para resetear contraseña
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (error) {
      setError("Ocurrió un error al intentar restablecer la contraseña");
    } finally {
      setIsLoading(false);
    }
  }

  if (!isValidToken) {
    return (
      <AuthLayout
        title="Enlace inválido"
        subtitle="Este enlace para restablecer la contraseña no es válido o ha expirado"
        showDemoAlert={false}
      >
        <div className="bg-background rounded-xl border border-border p-8 text-center space-y-6">
          <div className="mx-auto w-12 h-12 rounded-full bg-error/10 flex items-center justify-center">
            <XCircleIcon className="w-6 h-6 text-error" />
          </div>
          <p className="text-sm text-content">
            Por favor, solicita un nuevo enlace para restablecer tu contraseña.
          </p>
          <Link
            href="/forgot-password"
            className="text-primary hover:text-primary-hover font-medium block"
          >
            Solicitar nuevo enlace
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (success) {
    return (
      <AuthLayout
        title="¡Contraseña actualizada!"
        subtitle="Tu contraseña ha sido restablecida exitosamente"
        showDemoAlert={false}
      >
        <div className="bg-background rounded-xl border border-border p-8 text-center space-y-6">
          <div className="mx-auto w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
            <CheckCircleIcon className="w-6 h-6 text-success" />
          </div>
          <p className="text-sm text-content">
            Serás redirigido al inicio de sesión en unos segundos...
          </p>
          <Link
            href="/login"
            className="text-primary hover:text-primary-hover font-medium block"
          >
            Ir al inicio de sesión
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Restablecer contraseña"
      subtitle="Ingresa y confirma tu nueva contraseña"
      showDemoAlert={false}
    >
      <AuthForm
        onSubmit={handleSubmit}
        error={error}
        isLoading={isLoading}
        submitText="Guardar nueva contraseña"
      >
        <FormField>
          <FormLabel htmlFor="password">Nueva contraseña</FormLabel>
          <Input
            id="password"
            name="password"
            type="password"
            required
            placeholder="••••••••"
            disabled={isLoading}
          />
          <FormDescription>
            La contraseña debe tener al menos 8 caracteres
          </FormDescription>
        </FormField>
        <FormField>
          <FormLabel htmlFor="confirmPassword">Confirmar contraseña</FormLabel>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            placeholder="••••••••"
            disabled={isLoading}
          />
        </FormField>
        <input type="hidden" name="token" value={token ?? ""} />
      </AuthForm>
    </AuthLayout>
  );
}
