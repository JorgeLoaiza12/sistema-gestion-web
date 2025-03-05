// app/(dashboard)/dashboard/team/page.tsx
"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FormTextarea } from "@/components/ui/form-textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  User as UserIcon,
  UserPlus,
  Users,
  Shield,
  Edit,
  Trash,
  Star,
  Calendar,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { FormInput } from "@/components/ui/form-input";
import { User } from "@/lib/definitions";

export default function TeamPage() {
  const [members, setMembers] = useState<(typeof User)[]>([]);

  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
  });

  const departments = [
    "Engineering",
    "Design",
    "Marketing",
    "Sales",
    "Customer Support",
  ];

  const roles = ["ADMIN", "WORKER"];

  const filteredMembers = members
    .filter(
      (member) =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((member) =>
      selectedDepartment === "all"
        ? true
        : member.department === selectedDepartment
    );

  const handleSave = () => {
    const newMember = {
      id: isEditing || Date.now().toString(),
      ...formData,
      status: "active" as const,
      joinedAt: new Date().toISOString().split("T")[0],
    };

    if (isEditing) {
      setMembers(members.map((m) => (m.id === isEditing ? newMember : m)));
    } else {
      setMembers([...members, newMember]);
    }

    setIsCreating(false);
    setIsEditing(null);
    resetForm();
  };

  const handleEdit = (member: User) => {
    setIsEditing(member.id);
    setFormData({
      name: member.name,
      email: member.email,
      role: member.role,
    });
  };

  const handleDelete = (id: string) => {
    if (
      confirm("¿Estás seguro de que deseas eliminar este miembro del equipo?")
    ) {
      setMembers(members.filter((m) => m.id !== id));
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      role: "",
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-content-emphasis">Usuarios</h1>
        <p className="text-content-subtle mt-2">
          Gestiona los miembros de tu equipo y sus roles
        </p>
      </div>
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-1 gap-4">
            <FormInput
              icon={Search}
              placeholder="Buscar miembro..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
            <Select
              value={selectedDepartment}
              onValueChange={setSelectedDepartment}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los departamentos</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setIsCreating(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Agregar Miembro
          </Button>
        </div>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredMembers.map((member) => (
          <Card key={member.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserIcon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium flex items-center gap-2">
                    {member.name}
                    {member.isAdmin && (
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    )}
                  </h3>
                  <p className="text-sm text-content-subtle">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(member)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(member.id)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-content-subtle" />
                <span>{member.role}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-content-subtle" />
                <span>{member.department}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-content-subtle" />
                <span>
                  Se unió el {new Date(member.joinedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <p className="mt-4 text-sm text-content-subtle">{member.bio}</p>
          </Card>
        ))}
      </div>
      <Dialog
        open={isCreating || Boolean(isEditing)}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreating(false);
            setIsEditing(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Editar Miembro" : "Nuevo Miembro"}
            </DialogTitle>
          </DialogHeader>
          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
          >
            <FormField>
              <FormLabel>Nombre completo</FormLabel>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </FormField>
            <FormField>
              <FormLabel>Correo electrónico</FormLabel>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </FormField>
            <FormField>
              <FormLabel>Departamento</FormLabel>
              <Select
                value={formData.department}
                onValueChange={(value) =>
                  setFormData({ ...formData, department: value, role: "" })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar departamento" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField>
              <FormLabel>Rol</FormLabel>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value })
                }
                disabled={!formData.department}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  {formData.department &&
                    roles[formData.department as keyof typeof roles].map(
                      (role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      )
                    )}
                </SelectContent>
              </Select>
            </FormField>
            <FormField>
              <FormLabel>Biografía</FormLabel>
              <FormTextarea
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
              />
            </FormField>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isAdmin"
                checked={formData.isAdmin}
                onChange={(e) =>
                  setFormData({ ...formData, isAdmin: e.target.checked })
                }
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="isAdmin" className="text-sm font-medium">
                Dar permisos de administrador
              </label>
            </div>
            <DialogFooter className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreating(false);
                  setIsEditing(null);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">Guardar cambios</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
