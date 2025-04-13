// web\components\users\UserForm.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField, FormLabel } from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User } from "@/services/users";
import { Loader2 } from "lucide-react";

interface UserFormProps {
  isOpen: boolean;
  user: User | null;
  onSave: (user: User) => Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
  showRoleSelector?: boolean; // Nueva propiedad para controlar si se muestra el selector de rol
}

export default function UserForm({
  isOpen,
  user,
  onSave,
  onClose,
  isLoading = false,
  showRoleSelector = false, // Por defecto no se muestra
}: UserFormProps) {
  const [userForm, setUserForm] = useState<User & { password?: string }>({
    name: "",
    email: "",
    role: "WORKER",
    password: "",
  });
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setUserForm({
        ...user,
        password: "", // Siempre vacío por seguridad
      });
      setPasswordConfirm("");
    } else {
      // Reset form for new user
      setUserForm({
        name: "",
        email: "",
        role: "WORKER",
        password: "",
      });
      setPasswordConfirm("");
    }
    setError(null);
  }, [user, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones básicas
    if (!userForm.name || !userForm.email) {
      setError("Nombre y email son obligatorios");
      return;
    }

    // Si es un nuevo usuario o si se está cambiando la contraseña
    if (!user?.id && (!userForm.password || userForm.password.length < 6)) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (userForm.password && userForm.password !== passwordConfirm) {
      setError("Las contraseñas no coinciden");
      return;
    }

    // Enviar datos
    try {
      await onSave(userForm);
    } catch (err) {
      setError("Error al guardar el usuario");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{user ? "Editar Usuario" : "Nuevo Usuario"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField>
            <FormLabel>Nombre</FormLabel>
            <Input
              value={userForm.name}
              onChange={(e) =>
                setUserForm({ ...userForm, name: e.target.value })
              }
              required
              disabled={isLoading}
            />
          </FormField>

          <FormField>
            <FormLabel>Email</FormLabel>
            <Input
              type="email"
              value={userForm.email}
              onChange={(e) =>
                setUserForm({ ...userForm, email: e.target.value })
              }
              required
              disabled={isLoading}
            />
          </FormField>

          {/* Selector de Rol - Solo se muestra si showRoleSelector es true */}
          {showRoleSelector && (
            <FormField>
              <FormLabel>Rol</FormLabel>
              <Select
                value={userForm.role}
                onValueChange={(value) =>
                  setUserForm({
                    ...userForm,
                    role: value as "ADMIN" | "WORKER",
                  })
                }
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                  <SelectItem value="WORKER">Técnico</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          )}

          {/* Mostrar campos de contraseña solo para nuevos usuarios */}
          {!user?.id && (
            <>
              <FormField>
                <FormLabel>Contraseña</FormLabel>
                <Input
                  type="password"
                  value={userForm.password}
                  onChange={(e) =>
                    setUserForm({ ...userForm, password: e.target.value })
                  }
                  required={!user?.id}
                  disabled={isLoading}
                />
              </FormField>

              <FormField>
                <FormLabel>Confirmar Contraseña</FormLabel>
                <Input
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  required={!user?.id}
                  disabled={isLoading}
                />
              </FormField>
            </>
          )}

          {error && (
            <div className="text-red-500 text-sm p-2 bg-red-50 border border-red-200 rounded">
              {error}
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {user ? "Guardando..." : "Creando..."}
                </div>
              ) : user ? (
                "Guardar cambios"
              ) : (
                "Crear usuario"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
