// components/auth/auth-form.tsx
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { FormEvent, ReactNode } from "react";

interface AuthFormProps {
  onSubmit: (e: FormEvent<HTMLFormElement>) => Promise<void>;
  children: ReactNode;
  error?: string | null;
  submitText: string;
  isLoading?: boolean;
  footerContent?: ReactNode;
  className?: string;
}

export function AuthForm({
  onSubmit,
  children,
  error,
  submitText,
  isLoading = false,
  footerContent,
  className,
}: AuthFormProps) {
  return (
    <Card className={cn("p-6 shadow-lg", className)}>
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-4">{children}</div>

        {error && (
          <div className="p-3 rounded-lg bg-error/10 border border-error/20">
            <p className="text-sm text-error text-center">{error}</p>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Cargando...
            </>
          ) : (
            submitText
          )}
        </Button>

        {footerContent && (
          <div className="mt-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-content-subtle">
                {footerContent}
              </span>
            </div>
          </div>
        )}
      </form>
    </Card>
  );
}
