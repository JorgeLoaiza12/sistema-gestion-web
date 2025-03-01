// components/auth/providers-buttons.tsx
import { Button } from "@/components/ui/button";

interface ProvidersButtonsProps {
  onGoogleClick?: () => void;
  onGithubClick?: () => void;
  isLoading?: boolean;
}

export function ProvidersButtons({
  onGoogleClick,
  onGithubClick,
  isLoading = false,
}: ProvidersButtonsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Button
        type="button"
        variant="outline"
        onClick={onGoogleClick}
        disabled={isLoading}
        className="w-full"
      >
        Google
      </Button>

      <Button
        type="button"
        variant="outline"
        onClick={onGithubClick}
        disabled={isLoading}
        className="w-full"
      >
        GitHub
      </Button>
    </div>
  );
}
