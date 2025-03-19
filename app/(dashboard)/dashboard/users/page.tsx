"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable, type ColumnDef } from "@/components/ui/table";
import {
  Plus,
  Edit,
  Trash,
  Shield,
  User as UserIcon,
  Calendar,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useNotification } from "@/contexts/NotificationContext";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  User,
} from "@/services/users";
import UserForm from "@/components/users/UserForm";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const { addNotification } = useNotification();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    // Filtrar usuarios por término de búsqueda con validación
    const filtered = users.filter(
      (user) =>
        (user.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (user.email?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await getUsers();
      console.log("Usuarios cargados:", data); // Para depuración
      setUsers(data);
      setFilteredUsers(data);
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
      addNotification("error", "Error al cargar los usuarios");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = () => {
    setCurrentUser(null);
    setIsEditing(true);
  };

  const handleEditUser = (user: User) => {
    setCurrentUser(user);
    setIsEditing(true);
  };

  const handleDeleteConfirm = (user: User) => {
    setUserToDelete(user);
    setIsDeleteConfirmOpen(true);
  };

  const handleSaveUser = async (userData: User) => {
    try {
      if (currentUser && currentUser.id) {
        // Actualizar usuario existente
        const response = await updateUser(currentUser.id.toString(), userData);
        setUsers(
          users.map((u) => (u.id === currentUser.id ? response.user : u))
        );
        addNotification("success", "Usuario actualizado correctamente");
      } else {
        // Crear nuevo usuario
        const response = await createUser(userData);
        setUsers([...users, response.user]);
        addNotification("success", "Usuario creado correctamente");
      }
      setIsEditing(false);
      setCurrentUser(null);
    } catch (err) {
      console.error("Error al guardar usuario:", err);
      addNotification("error", "Error al guardar el usuario");
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      setIsDeletingUser(true);
      await deleteUser(userToDelete.id.toString());
      setUsers(users.filter((user) => user.id !== userToDelete.id));
      addNotification("success", "Usuario eliminado correctamente");
    } catch (err) {
      console.error("Error al eliminar usuario:", err);
      addNotification("error", "Error al eliminar el usuario");
    } finally {
      setIsDeletingUser(false);
      setIsDeleteConfirmOpen(false);
      setUserToDelete(null);
    }
  };

  // Columnas para la tabla de usuarios
  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "name",
      header: "Nombre",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <UserIcon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-medium">{row.original.name || "Sin nombre"}</p>
            <p className="text-sm text-content-subtle">
              {row.original.email || "Sin email"}
            </p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "Rol",
      cell: ({ row }) => (
        <Badge variant={row.original.role === "ADMIN" ? "primary" : "outline"}>
          <div className="flex items-center gap-1">
            {row.original.role === "ADMIN" && <Shield className="h-3 w-3" />}
            {row.original.role === "ADMIN" ? "Administrador" : "Técnico"}
          </div>
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Fecha de registro",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-content-subtle" />
          {row.original.createdAt
            ? new Date(row.original.createdAt).toLocaleDateString()
            : "N/A"}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditUser(row.original)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteConfirm(row.original)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-content-emphasis">Usuarios</h1>
        <p className="text-content-subtle mt-2">
          Gestiona los usuarios y técnicos de la plataforma
        </p>
      </div>

      <Card className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h2 className="text-xl font-semibold">Lista de Usuarios</h2>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <Input
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
            <Button onClick={handleAddUser}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Usuario
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center h-96 flex items-center justify-center">
            <p>Cargando usuarios...</p>
          </div>
        ) : (
          <DataTable columns={columns} data={filteredUsers} />
        )}
      </Card>

      {/* Formulario para crear/editar usuario */}
      <UserForm
        isOpen={isEditing}
        user={currentUser}
        onSave={handleSaveUser}
        onClose={() => setIsEditing(false)}
      />

      {/* Diálogo de confirmación para eliminar */}
      <ConfirmDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        title="Eliminar Usuario"
        description={`¿Estás seguro que deseas eliminar al usuario "${
          userToDelete?.name || "seleccionado"
        }"? Esta acción no se puede deshacer.`}
        onConfirm={handleDeleteUser}
        confirmLabel="Eliminar"
        isLoading={isDeletingUser}
      />
    </div>
  );
}
