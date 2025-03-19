// components/auth/auth-form.tsx
import { CSRFProtectedForm } from "@/components/ui/csrf-protected-form";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { FormEvent, ReactNode } from "react";

interface AuthFormProps {
  onSubmit: (e: FormEvent<HTMLFormElement>) => Promise<void>;
  children: ReactNode;
  error?: string | null;
  submitText: string;
  isLoading?: boolean;
  className?: string;
}

export function AuthForm({
  onSubmit,
  children,
  error,
  submitText,
  isLoading = false,
  className,
}: AuthFormProps) {
  return (
    <Card className={cn("p-6 shadow-lg", className)}>
      <CSRFProtectedForm
        onSubmit={onSubmit}
        error={error}
        submitText={submitText}
        isLoading={isLoading}
      >
        {children}
      </CSRFProtectedForm>
    </Card>
  );
}