// components/ui/form-input.tsx
import {
  FormField,
  FormLabel,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: LucideIcon;
  description?: string;
  error?: string;
  fullWidth?: boolean;
  containerClassName?: string;
}

export function FormInput({
  label,
  icon: Icon,
  description,
  error,
  fullWidth = false,
  containerClassName,
  className,
  disabled,
  ...props
}: FormInputProps) {
  return (
    <FormField className={containerClassName}>
      <FormLabel>
        <div className="flex items-center gap-2 relative">
          {Icon && (
            <Icon className="h-4 w-4 text-content-subtle absolute top-3 left-2" />
          )}
          {label && label}
        </div>
      </FormLabel>
      <Input
        className={cn(
          Icon && "pl-8 !m-0",
          className
        )}
        disabled={disabled}
        {...props}
      />
      {description && <FormDescription>{description}</FormDescription>}
      {error && <FormMessage>{error}</FormMessage>}
    </FormField>
  );
}
