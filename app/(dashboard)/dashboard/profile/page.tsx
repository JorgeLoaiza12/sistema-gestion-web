"use client"
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField, FormLabel } from "@/components/ui/form";
import { UserAvatar } from "@/components/dashboard/user-avatar";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Globe,
  Twitter,
  Github,
  Linkedin,
  Save,
} from "lucide-react";

export default function ProfilePage() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [profile, setProfile] = useState({
    name: "Usuario de Prueba",
    email: "test@example.com",
    phone: "+1234567890",
    location: "Ciudad de México, México",
    company: "Tech Company",
    website: "https://example.com",
    bio: "Senior Software Developer con más de 5 años de experiencia en desarrollo web y aplicaciones móviles. Apasionado por las nuevas tecnologías y el aprendizaje continuo.",
    social: {
      twitter: "@usuario",
      github: "usuario",
      linkedin: "usuario",
    },
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsUpdating(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // Aquí iría la llamada al backend
      console.log("Perfil actualizado:", profile);
    } catch (error) {
      console.error("Error al actualizar el perfil:", error);
    } finally {
      setIsUpdating(false);
    }
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

          <div className="flex items-center gap-6 mb-6 pb-6 border-b">
            <UserAvatar />
            <div>
              <h3 className="font-medium text-content">Foto de Perfil</h3>
              <p className="text-sm text-content-subtle mt-1">
                Esta foto se mostrará en tu perfil y notificaciones
              </p>
            </div>
          </div>

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

            <FormField>
              <FormLabel>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Ubicación
                </div>
              </FormLabel>
              <Input
                value={profile.location}
                onChange={(e) =>
                  setProfile({ ...profile, location: e.target.value })
                }
              />
            </FormField>

            <FormField>
              <FormLabel>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Empresa
                </div>
              </FormLabel>
              <Input
                value={profile.company}
                onChange={(e) =>
                  setProfile({ ...profile, company: e.target.value })
                }
              />
            </FormField>

            <FormField>
              <FormLabel>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Sitio web
                </div>
              </FormLabel>
              <Input
                type="url"
                value={profile.website}
                onChange={(e) =>
                  setProfile({ ...profile, website: e.target.value })
                }
              />
            </FormField>
          </div>

          <FormField className="mt-6">
            <FormLabel>Biografía</FormLabel>
            <textarea
              className="min-h-[100px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            />
          </FormField>
        </Card>

        {/* Redes Sociales */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">Redes Sociales</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField>
              <FormLabel>
                <div className="flex items-center gap-2">
                  <Twitter className="h-4 w-4" />
                  Twitter
                </div>
              </FormLabel>
              <Input
                value={profile.social.twitter}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    social: { ...profile.social, twitter: e.target.value },
                  })
                }
              />
            </FormField>

            <FormField>
              <FormLabel>
                <div className="flex items-center gap-2">
                  <Github className="h-4 w-4" />
                  GitHub
                </div>
              </FormLabel>
              <Input
                value={profile.social.github}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    social: { ...profile.social, github: e.target.value },
                  })
                }
              />
            </FormField>

            <FormField className="md:col-span-2">
              <FormLabel>
                <div className="flex items-center gap-2">
                  <Linkedin className="h-4 w-4" />
                  LinkedIn
                </div>
              </FormLabel>
              <Input
                value={profile.social.linkedin}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    social: { ...profile.social, linkedin: e.target.value },
                  })
                }
              />
            </FormField>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isUpdating} size="lg">
            {isUpdating ? (
              <>Guardando...</>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar cambios
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
