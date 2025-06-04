// web/components/users/UserForm.tsx
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
import { useSession } from "next-auth/react";

interface UserFormProps {
  isOpen: boolean;
  user: User | null;
  onSave: (userData: User, newPassword?: string) => Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
  showRoleSelector?: boolean;
}

export default function UserForm({
  isOpen,
  user,
  onSave,
  onClose,
  isLoading = false,
  showRoleSelector = false,
}: UserFormProps) {
  const { data: session } = useSession();
  const [userForm, setUserForm] = useState<User & { password?: string }>({
    id: 0, // Temporal, se sobrescribe
    name: "",
    email: "",
    role: "WORKER",
    password: "",
    phone: "",
  });
  const [newPasswordByAdmin, setNewPasswordByAdmin] = useState(""); // Para admin cambiando contraseña de otro
  const [confirmNewPasswordByAdmin, setConfirmNewPasswordByAdmin] =
    useState(""); // Para admin

  const [error, setError] = useState<string | null>(null);

  const loggedInUser = session?.user;
  const isAdminLoggedIn = loggedInUser?.role === "ADMIN";
  // Determina si un admin está editando a OTRO usuario (no a sí mismo)
  const isAdminEditingOtherUser =
    isAdminLoggedIn && user && user.id !== parseInt(loggedInUser?.id || "0");

  useEffect(() => {
    if (isOpen) {
      // Resetear estados solo cuando el diálogo se abre
      if (user) {
        setUserForm({
          ...user,
          password: "", // No precargar contraseña al editar
        });
      } else {
        setUserForm({
          id: 0, // Temporal
          name: "",
          email: "",
          role: "WORKER",
          password: "", // Para creación de nuevo usuario
          phone: "",
        });
      }
      setNewPasswordByAdmin("");
      setConfirmNewPasswordByAdmin("");
      setError(null);
    }
  }, [user, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!userForm.name || !userForm.email) {
      setError("Nombre y email son obligatorios.");
      return;
    }

    let passwordPayload: string | undefined = undefined;

    if (!user) {
      // Creando un nuevo usuario
      if (!userForm.password || userForm.password.length < 8) {
        setError(
          "La contraseña para el nuevo usuario debe tener al menos 8 caracteres."
        );
        return;
      }
      if (userForm.password !== confirmNewPasswordByAdmin) {
        // Reutilizamos confirmNewPasswordByAdmin para la confirmación del nuevo usuario
        setError("Las contraseñas para el nuevo usuario no coinciden.");
        return;
      }
      passwordPayload = userForm.password;
    } else if (isAdminEditingOtherUser) {
      // Admin editando a otro usuario
      if (newPasswordByAdmin) {
        // Si el admin ingresó una nueva contraseña
        if (newPasswordByAdmin.length < 8) {
          setError(
            "La nueva contraseña establecida por el administrador debe tener al menos 8 caracteres."
          );
          return;
        }
        if (newPasswordByAdmin !== confirmNewPasswordByAdmin) {
          setError(
            "Las nuevas contraseñas establecidas por el administrador no coinciden."
          );
          return;
        }
        passwordPayload = newPasswordByAdmin;
      }
    }

    try {
      // El password en userForm (para creación) o newPasswordByAdmin (para admin editando)
      // se pasa como segundo argumento a onSave.
      await onSave(userForm, passwordPayload);
    } catch (err: any) {
      setError(err.message || "Error al guardar el usuario");
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !isLoading && onClose()}
    >
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
              disabled={isLoading || !!user} // No permitir cambiar email al editar por simplicidad, o manejarlo con cuidado en backend
            />
          </FormField>

          <FormField>
            <FormLabel>Teléfono (opcional)</FormLabel>
            <Input
              value={userForm.phone || ""}
              onChange={(e) =>
                setUserForm({ ...userForm, phone: e.target.value })
              }
              disabled={isLoading}
            />
          </FormField>

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
                disabled={
                  isLoading || user?.id === parseInt(loggedInUser?.id || "0")
                } // Admin no puede cambiarse el rol a sí mismo
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

          {!user && ( // Campos de contraseña solo para la creación de nuevos usuarios
            <>
              <FormField>
                <FormLabel>Contraseña</FormLabel>
                <Input
                  type="password"
                  value={userForm.password}
                  onChange={(e) =>
                    setUserForm({ ...userForm, password: e.target.value })
                  }
                  required={!user}
                  disabled={isLoading}
                  placeholder="Mínimo 8 caracteres"
                />
              </FormField>

              <FormField>
                <FormLabel>Confirmar Contraseña</FormLabel>
                <Input
                  type="password"
                  value={confirmNewPasswordByAdmin}
                  onChange={(e) => setConfirmNewPasswordByAdmin(e.target.value)}
                  required={!user}
                  disabled={isLoading}
                />
              </FormField>
            </>
          )}

          {isAdminEditingOtherUser && (
            <div className="mt-4 pt-4 border-t">
              <h3 className="text-md font-semibold mb-2">
                Establecer Nueva Contraseña (Admin)
              </h3>
              <p className="text-xs text-gray-500 mb-2">
                Dejar en blanco para no cambiar la contraseña actual del
                usuario.
              </p>
              <FormField>
                <FormLabel>Nueva Contraseña</FormLabel>
                <Input
                  type="password"
                  value={newPasswordByAdmin}
                  onChange={(e) => setNewPasswordByAdmin(e.target.value)}
                  disabled={isLoading}
                  placeholder="Mínimo 8 caracteres"
                />
              </FormField>
              <FormField>
                <FormLabel>Confirmar Nueva Contraseña</FormLabel>
                <Input
                  type="password"
                  value={confirmNewPasswordByAdmin}
                  onChange={(e) => setConfirmNewPasswordByAdmin(e.target.value)}
                  disabled={isLoading}
                />
              </FormField>
            </div>
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
