"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function UserAvatar() {
  const [isUploading, setIsUploading] = useState(false);

  async function handleAvatarChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    if (!event.target.files?.[0]) return;

    setIsUploading(true);
    try {
      // Aquí implementaremos la subida del avatar cuando tengamos el backend
    } catch (error) {
      console.error("Error al subir el avatar:", error);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="relative">
      <input
        type="file"
        accept="image/*"
        className="hidden"
        id="avatar-upload"
        onChange={handleAvatarChange}
        disabled={isUploading}
      />
      <label htmlFor="avatar-upload">
        <Button
          variant="ghost"
          className="relative w-10 h-10 rounded-full overflow-hidden border border-border hover:border-border-focus"
          disabled={isUploading}
        >
          {/* Placeholder de avatar - Reemplazar con imagen real cuando tengamos backend */}
          <div className="w-full h-full bg-secondary flex items-center justify-center">
            <span className="text-lg font-medium text-secondary-foreground">
              A
            </span>
          </div>
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white text-sm">Subiendo...</span>
            </div>
          )}
        </Button>
      </label>
    </div>
  );
}
