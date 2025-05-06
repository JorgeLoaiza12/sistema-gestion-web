// web\components\tasks\UserMultiSelect.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList 
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, ChevronsUpDown, Loader2, Plus, X, Users } from "lucide-react";
import { User } from "@/services/users";
import { createUser } from "@/services/users";
import { useNotification } from "@/contexts/NotificationContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface UserMultiSelectProps {
  workers: User[];
  selectedWorkerIds: number[];
  onSelectionChange: (selectedWorkerIds: number[]) => void;
  onUserCreated?: (user: User) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export default function UserMultiSelect({
  workers,
  selectedWorkerIds,
  onSelectionChange,
  onUserCreated,
  isLoading = false,
  disabled = false,
}: UserMultiSelectProps) {
  const { addNotification } = useNotification();
  const [open, setOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [newUser, setNewUser] = useState<Partial<User>>({
    name: "",
    email: "",
    password: "",
    role: "WORKER",
    phone: "",
  });
  const [validationError, setValidationError] = useState<string | null>(null);

  // Filtrar trabajadores según término de búsqueda
  const filteredWorkers = workers.filter((worker) => {
    const search = searchTerm.toLowerCase();
    return (
      worker.name?.toLowerCase().includes(search) ||
      worker.email?.toLowerCase().includes(search)
    );
  });

  // Actualizar selecciones
  const handleSelectWorker = (workerId: number) => {
    if (selectedWorkerIds.includes(workerId)) {
      onSelectionChange(selectedWorkerIds.filter(id => id !== workerId));
    } else {
      onSelectionChange([...selectedWorkerIds, workerId]);
    }
  };

  // Eliminar un trabajador seleccionado
  const handleRemoveWorker = (e: React.MouseEvent, workerId: number) => {
    e.stopPropagation();
    onSelectionChange(selectedWorkerIds.filter(id => id !== workerId));
  };

  // Preparar para agregar nuevo usuario
  const handleAddNewUser = () => {
    setIsAddModalOpen(true);
    setNewUser({
      name: "",
      email: "",
      password: "",
      role: "WORKER",
      phone: "",
    });
    setValidationError(null);
  };

  // Guardar nuevo usuario
  const handleSaveNewUser = async () => {
    // Validación básica
    if (!newUser.name) {
      setValidationError("El nombre es obligatorio");
      return;
    }
    if (!newUser.email) {
      setValidationError("El email es obligatorio");
      return;
    }
    if (!newUser.password) {
      setValidationError("La contraseña es obligatoria");
      return;
    }

    try {
      setIsSavingUser(true);
      const createdUser = await createUser(newUser as User);
      if (createdUser) {
        setIsAddModalOpen(false);
        if (onUserCreated) {
          onUserCreated(createdUser);
        }
        // Seleccionar automáticamente el usuario recién creado
        if (createdUser.id) {
          handleSelectWorker(createdUser.id);
        }
        addNotification("success", "Usuario creado correctamente");
      }
    } catch (error) {
      console.error("Error al crear usuario:", error);
      setValidationError("Error al crear el usuario");
      addNotification("error", "Error al crear el usuario");
    } finally {
      setIsSavingUser(false);
    }
  };

  // Encontrar los usuarios seleccionados
  const selectedUsers = workers.filter(worker => 
    selectedWorkerIds.includes(worker.id)
  );

  // Texto a mostrar en el botón desplegable
  const getButtonText = () => {
    if (isLoading) return "Cargando técnicos...";
    if (selectedWorkerIds.length === 0) return "Seleccionar técnicos";
    if (selectedWorkerIds.length === 1) return `${selectedUsers.length > 0 ? selectedUsers[0].name : '1 técnico seleccionado'}`;
    return `${selectedWorkerIds.length} técnicos seleccionados`;
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={isLoading || disabled}
          >
            <div className="flex items-center overflow-hidden">
              <Users className="h-4 w-4 mr-2 text-gray-500" />
              <span className="truncate">{getButtonText()}</span>
            </div>
            {isLoading ? (
              <Loader2 className="ml-2 h-4 w-4 shrink-0 opacity-50 animate-spin" />
            ) : (
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput 
              placeholder="Buscar técnico..." 
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList>
              <CommandEmpty>
                <div className="py-3 px-4 text-center space-y-2">
                  <p className="text-sm">No se encontraron técnicos</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={handleAddNewUser}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar nuevo técnico
                  </Button>
                </div>
              </CommandEmpty>
              <CommandGroup heading="Técnicos disponibles">
                {filteredWorkers.map((worker) => {
                  const isSelected = selectedWorkerIds.includes(worker.id);
                  return (
                    <CommandItem
                      key={worker.id}
                      value={worker.id.toString()}
                      onSelect={() => handleSelectWorker(worker.id)}
                      className="flex items-center justify-between"
                    >
                      <div className="flex flex-col">
                        <span>{worker.name}</span>
                        <span className="text-xs text-gray-500">{worker.email}</span>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-primary"/>}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              <div className="p-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={handleAddNewUser}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar nuevo técnico
                </Button>
              </div>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Mostrar usuarios seleccionados como badges */}
      <div className="flex flex-wrap gap-2 mt-2">
        {selectedUsers.map((user) => (
          <Badge key={user.id} variant="secondary" className="px-2 py-1 text-sm">
            {user.name}
            <X 
              className="h-3 w-3 ml-1 cursor-pointer" 
              onClick={(e) => handleRemoveWorker(e, user.id)}
            />
          </Badge>
        ))}
      </div>

      {/* Modal para agregar nuevo usuario */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar nuevo técnico</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-3">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={newUser.name || ""}
                onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                disabled={isSavingUser}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email || ""}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                disabled={isSavingUser}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={newUser.password || ""}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                disabled={isSavingUser}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Teléfono (opcional)</Label>
              <Input
                id="phone"
                value={newUser.phone || ""}
                onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                disabled={isSavingUser}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="role">Rol</Label>
              <Select
                value={newUser.role || "WORKER"}
                onValueChange={(value) => setNewUser({...newUser, role: value})}
                disabled={isSavingUser}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WORKER">Técnico</SelectItem>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {validationError && (
              <div className="text-sm text-red-500 bg-red-50 border border-red-200 p-2 rounded">
                {validationError}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isSavingUser}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveNewUser}
              disabled={isSavingUser}
            >
              {isSavingUser ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}