import { Switch } from "./switch";
import { FormField, FormLabel, FormDescription } from "@/components/ui/form";
import { LucideIcon } from "lucide-react";

interface FormSwitchProps {
  label?: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  icon?: LucideIcon;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
}

export function FormSwitch({
  label,
  description,
  checked,
  onCheckedChange,
  icon: Icon,
  size,
  disabled,
  className,
}: FormSwitchProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        {Icon && <Icon className="h-5 w-5 text-content-subtle" />}
        <div>
          {label && <p className="font-medium">{label}</p>}
          {description && (
            <p className="text-sm text-content-subtle">{description}</p>
          )}
        </div>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        size={size}
        disabled={disabled}
        className={className}
      />
    </div>
  );
}
