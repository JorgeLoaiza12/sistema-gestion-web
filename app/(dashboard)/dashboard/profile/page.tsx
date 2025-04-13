"use client";
import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField, FormLabel, FormDescription } from "@/components/ui/form";
import { FormTextarea } from "@/components/ui/form-textarea";
import { useNotification } from "@/contexts/NotificationContext";
import { useSession } from "next-auth/react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Globe,
  Save,
  Upload,
  Lock,
  Loader2,
  FileText,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  getProfile,
  updateProfile,
  updatePassword,
  ProfileUpdateData,
  PasswordUpdateData,
} from "@/services/profile";

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordData, setPasswordData] = useState<PasswordUpdateData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addNotification } = useNotification();

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        const profileData = await getProfile();

        setProfile({
          name: profileData.name || "",
          email: profileData.email || "",
          phone: profileData.phone || "",
          role: profileData.role || "WORKER",
        });
      } catch (error) {
        console.error("Error al cargar el perfil:", error);
        addNotification("error", "No se pudo cargar la información del perfil");
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [addNotification]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsUpdating(true);

    try {
      const updateData: ProfileUpdateData = {
        name: profile.name,
        phone: profile.phone,
      };

      const result = await updateProfile(updateData);

      // Actualizar la sesión con el nuevo nombre si cambió
      if (
        result.user &&
        session &&
        session.user &&
        result.user.name !== session.user.name
      ) {
        await updateSession({
          ...session,
          user: {
            ...session.user,
            name: result.user.name,
          },
        });
      }

      addNotification("success", "Perfil actualizado correctamente");
    } catch (error) {
      console.error("Error al actualizar el perfil:", error);
      addNotification("error", "Error al actualizar el perfil");
    } finally {
      setIsUpdating(false);
    }
  }

  async function handlePasswordChange() {
    setPasswordError(null);

    // Validación simple
    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      setPasswordError("Todos los campos son obligatorios");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("Las nuevas contraseñas no coinciden");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError("La nueva contraseña debe tener al menos 8 caracteres");
      return;
    }

    try {
      await updatePassword(passwordData);
      setPasswordModalOpen(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      addNotification("success", "Contraseña actualizada correctamente");
    } catch (error: any) {
      console.error("Error al actualizar la contraseña:", error);
      setPasswordError(error.message || "Error al actualizar la contraseña");
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-content-emphasis">Mi Perfil</h1>
        <p className="text-content-subtle mt-2">
          Administra tu información personal y preferencias
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información Personal */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">Información Personal</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField>
              <FormLabel>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nombre completo
                </div>
              </FormLabel>
              <Input
                value={profile.name}
                onChange={(e) =>
                  setProfile({ ...profile, name: e.target.value })
                }
              />
            </FormField>

            <FormField>
              <FormLabel>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Correo electrónico
                </div>
              </FormLabel>
              <Input type="email" value={profile.email} disabled />
              <FormDescription>
                El correo electrónico no se puede cambiar
              </FormDescription>
            </FormField>

            <FormField>
              <FormLabel>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Teléfono
                </div>
              </FormLabel>
              <Input
                type="tel"
                value={profile.phone}
                onChange={(e) =>
                  setProfile({ ...profile, phone: e.target.value })
                }
              />
            </FormField>
          </div>
        </Card>

        {/* Información Profesional */}

        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => setPasswordModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Lock className="h-4 w-4" />
            Cambiar contraseña
          </Button>

          <Button type="submit" disabled={isUpdating} size="lg">
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar cambios
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Modal de cambio de contraseña */}
      <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cambiar contraseña</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <FormField>
              <FormLabel>Contraseña actual</FormLabel>
              <Input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    currentPassword: e.target.value,
                  })
                }
              />
            </FormField>
            <FormField>
              <FormLabel>Nueva contraseña</FormLabel>
              <Input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    newPassword: e.target.value,
                  })
                }
              />
            </FormField>
            <FormField>
              <FormLabel>Confirmar nueva contraseña</FormLabel>
              <Input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    confirmPassword: e.target.value,
                  })
                }
              />
            </FormField>
            {passwordError && (
              <div className="text-error text-sm">{passwordError}</div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPasswordModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={handlePasswordChange}>
              Cambiar contraseña
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
