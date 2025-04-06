"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthForm } from "@/components/auth/auth-form";
import { FormField, FormLabel, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { CheckCircleIcon, XCircleIcon } from "lucide-react";
import Link from "next/link";

function ResetPasswordPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [success, setSuccess] = useState(false);

  // Obtener token de la URL
  const token = searchParams.get("token");

  // Validar token al cargar la página
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsValidatingToken(false);
        return;
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/validate-reset-token/${token}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          setIsTokenValid(true);
        } else {
          setIsTokenValid(false);
        }
      } catch (error) {
        console.error("Error validando token:", error);
        setIsTokenValid(false);
      } finally {
        setIsValidatingToken(false);
      }
    };

    validateToken();
  }, [token]);

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
      // Añadir await aquí para esperar la respuesta
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al restablecer la contraseña");
      }

      setSuccess(true);
      // Redirección automática después de 3 segundos
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (error: any) {
      console.error("Error al restablecer contraseña:", error);
      setError(
        error.message ||
          "Ocurrió un error al intentar restablecer la contraseña"
      );
    } finally {
      setIsLoading(false);
    }
  }

  // Mostrar pantalla de carga mientras se valida el token
  if (isValidatingToken) {
    return (
      <AuthLayout
        title="Validando enlace"
        subtitle="Por favor espera mientras validamos tu enlace"
        showDemoAlert={false}
      >
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AuthLayout>
    );
  }

  // Mostrar error si el token no es válido
  if (!isTokenValid) {
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

  // Mostrar pantalla de éxito después de cambiar la contraseña
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

  // Formulario para resetear contraseña
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <ResetPasswordPageContent />
    </Suspense>
  );
}