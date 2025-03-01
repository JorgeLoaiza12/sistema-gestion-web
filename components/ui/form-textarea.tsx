// components/ui/form-textarea.tsx
import {
  FormField,
  FormLabel,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface FormTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  icon?: LucideIcon;
  description?: string;
  error?: string;
  fullWidth?: boolean;
  containerClassName?: string;
}

export function FormTextarea({
  label,
  icon: Icon,
  description,
  error,
  fullWidth = false,
  containerClassName,
  className,
  disabled,
  ...props
}: FormTextareaProps) {
  return (
    <FormField className={containerClassName}>
      <FormLabel>
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-content-subtle" />}
          {label}
        </div>
      </FormLabel>
      <textarea
        className={cn(
          "min-h-[100px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "resize-y",
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
