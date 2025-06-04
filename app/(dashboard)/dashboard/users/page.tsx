"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable, type ColumnDef } from "@/components/ui/table";
import { Plus, Edit, Trash, Shield, Calendar, KeyRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useNotification } from "@/contexts/NotificationContext";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  adminSetUserPassword,
  User,
} from "@/services/users";
import UserForm from "@/components/users/UserForm";
import { useSession } from "next-auth/react";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const { addNotification } = useNotification();
  const { data: session } = useSession();

  const isAdminLoggedIn = session?.user?.role === "ADMIN";

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
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
      setUsers(data);
      setFilteredUsers(data);
    } catch (err: any) {
      addNotification("error", err.message || "Error al cargar los usuarios");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = () => {
    setCurrentUser(null);
    setIsFormOpen(true);
  };

  const handleEditUser = (user: User) => {
    setCurrentUser(user);
    setIsFormOpen(true);
  };

  const handleDeleteConfirm = (user: User) => {
    setUserToDelete(user);
    setIsDeleteConfirmOpen(true);
  };

  const handleSaveUser = async (
    userData: User,
    newPasswordForUser?: string
  ) => {
    setIsSubmittingForm(true);
    try {
      if (currentUser && currentUser.id) {
        // Editando usuario existente
        const userToUpdate = { ...currentUser, ...userData }; // Combinar datos actuales con los del form
        const profileDataToUpdate: Partial<User> = {
          name: userToUpdate.name,
          email: userToUpdate.email, // Backend debería validar si el email ya existe (excepto para el usuario actual)
          role: userToUpdate.role,
          phone: userToUpdate.phone,
        };

        const response = await updateUser(
          currentUser.id.toString(),
          profileDataToUpdate
        );
        setUsers(
          users.map((u) => (u.id === currentUser.id ? response.user : u))
        );
        addNotification(
          "success",
          "Datos del usuario actualizados correctamente"
        );

        // Si es admin, está editando a OTRO usuario Y se proporcionó una nueva contraseña
        if (
          isAdminLoggedIn &&
          newPasswordForUser &&
          currentUser.id !== parseInt(session?.user?.id || "0")
        ) {
          await adminSetUserPassword(
            currentUser.id.toString(),
            newPasswordForUser
          );
          addNotification(
            "success",
            "Contraseña del usuario actualizada por el administrador."
          );
        }
      } else {
        // Creando nuevo usuario
        if (!userData.password && !newPasswordForUser) {
          // Esto no debería pasar si el form valida
          addNotification(
            "error",
            "La contraseña es requerida para crear un nuevo usuario."
          );
          setIsSubmittingForm(false);
          return;
        }
        const userToCreate: User = {
          ...userData,
          password: newPasswordForUser || userData.password, // newPasswordForUser tiene prioridad si se pasa
        };
        const response = await createUser(userToCreate);
        setUsers((prevUsers) => [...prevUsers, response.user]);
        addNotification("success", "Usuario creado correctamente");
      }
      setIsFormOpen(false);
      setCurrentUser(null);
      fetchUsers(); // Recargar la lista para reflejar cambios
    } catch (err: any) {
      addNotification("error", err.message || "Error al guardar el usuario");
      // No cerrar el formulario en caso de error para que el usuario pueda corregir
      // setIsFormOpen(false);
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeletingUser(true);
    try {
      await deleteUser(userToDelete.id.toString());
      setUsers(users.filter((user) => user.id !== userToDelete.id));
      addNotification("success", "Usuario eliminado correctamente");
    } catch (err: any) {
      addNotification("error", err.message || "Error al eliminar el usuario");
    } finally {
      setIsDeletingUser(false);
      setIsDeleteConfirmOpen(false);
      setUserToDelete(null);
    }
  };

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "name",
      header: "Nombre",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
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
        <div className="flex space-x-1">
          {isAdminLoggedIn && ( // Solo los admins pueden editar
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEditUser(row.original)}
              title="Editar usuario"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {isAdminLoggedIn &&
            row.original.id !== parseInt(session?.user?.id || "0") && ( // Admins pueden borrar a otros, no a sí mismos
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteConfirm(row.original)}
                title="Eliminar usuario"
              >
                <Trash className="h-4 w-4" />
              </Button>
            )}
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
            {isAdminLoggedIn && (
              <Button onClick={handleAddUser}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Usuario
              </Button>
            )}
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

      <UserForm
        isOpen={isFormOpen}
        user={currentUser}
        onSave={handleSaveUser}
        onClose={() => setIsFormOpen(false)}
        isLoading={isSubmittingForm}
        showRoleSelector={isAdminLoggedIn}
      />

      <ConfirmDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        title="Eliminar Usuario"
        description={`¿Estás seguro que deseas eliminar al usuario "${
          userToDelete?.name || "seleccionado"
        }"? Esta acción no se puede deshacer y podría afectar registros asociados.`}
        onConfirm={handleDeleteUser}
        confirmLabel="Eliminar"
        isLoading={isDeletingUser}
      />
    </div>
  );
}
