import { useState, useEffect } from "react";
import { FormField, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { EntityForm } from "@/components/ui/entity-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User } from "@/services/users";

interface UserFormProps {
  isOpen: boolean;
  user: User | null;
  onSave: (user: User) => Promise<void>;
  onClose: () => void;
}

export default function UserForm({
  isOpen,
  user,
  onSave,
  onClose,
}: UserFormProps) {
  const [formData, setFormData] = useState<User>({
    id: 0,
    name: "",
    email: "",
    role: "WORKER",
    password: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        password: "", // No se muestra la contraseña actual
      });
      setConfirmPassword("");
    } else {
      // Resetear el formulario para un nuevo usuario
      setFormData({
        id: 0,
        name: "",
        email: "",
        role: "WORKER",
        password: "",
      });
      setConfirmPassword("");
    }
    setError(null);
  }, [user, isOpen]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Validación básica
    if (!formData.name.trim()) {
      setError("El nombre es obligatorio");
      return;
    }

    if (!formData.email.trim()) {
      setError("El correo electrónico es obligatorio");
      return;
    }

    if (!user && !formData.password) {
      setError("La contraseña es obligatoria para nuevos usuarios");
      return;
    }

    if (formData.password && formData.password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setIsSubmitting(true);
    try {
      // Si se está editando y no se cambió la contraseña, se omite su envío
      if (user && !formData.password) {
        const { password, ...userData } = formData;
        await onSave(userData as User);
      } else {
        await onSave(formData);
      }
    } catch (err) {
      console.error("Error al guardar usuario:", err);
      setError("Error al guardar el usuario");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <EntityForm
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={user ? "Editar Usuario" : "Nuevo Usuario"}
      isLoading={isSubmitting}
      error={error}
    >
      <FormField>
        <FormLabel>Nombre completo</FormLabel>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </FormField>

      <FormField>
        <FormLabel>Correo electrónico</FormLabel>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </FormField>

      <FormField>
        <FormLabel>Rol</FormLabel>
        <Select
          value={formData.role}
          onValueChange={(value: "ADMIN" | "WORKER") =>
            setFormData({ ...formData, role: value })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ADMIN">Administrador</SelectItem>
            <SelectItem value="WORKER">Técnico</SelectItem>
          </SelectContent>
        </Select>
      </FormField>

      <FormField>
        <FormLabel>
          {user ? "Nueva contraseña (opcional)" : "Contraseña"}
        </FormLabel>
        <Input
          type="password"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          required={!user}
          placeholder={user ? "Dejar en blanco para mantener" : ""}
          minLength={!user ? 8 : undefined}
        />
      </FormField>

      <FormField>
        <FormLabel>Confirmar contraseña</FormLabel>
        <Input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required={!user || !!formData.password}
          placeholder={user ? "Dejar en blanco para mantener" : ""}
          minLength={!user || formData.password ? 8 : undefined}
        />
      </FormField>
    </EntityForm>
  );
}
