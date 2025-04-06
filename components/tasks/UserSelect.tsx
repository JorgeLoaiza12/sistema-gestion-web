import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import UserForm from "@/components/users/UserForm";
import { User } from "@/services/users";
import { useNotification } from "@/contexts/NotificationContext";
import { register } from "@/services/auth";

interface UserSelectProps {
  workers: User[];
  value: string;
  onValueChange: (value: string, worker?: User) => void;
  onUserCreated?: (user: User) => void;
  placeholder?: string;
  isLoading?: boolean;
}

export default function UserSelect({
  workers,
  value,
  onValueChange,
  onUserCreated,
  placeholder = "Seleccionar técnico",
  isLoading = false,
}: UserSelectProps) {
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const { addNotification } = useNotification();
  const [processedWorkers, setProcessedWorkers] = useState<User[]>([]);

  useEffect(() => {
    // Procesar workers para asegurarse de que tengan todos los campos necesarios
    if (workers && Array.isArray(workers)) {
      const processed = workers.map((worker) => ({
        ...worker,
        // Asegurar que exista un nombre (usar email si no hay nombre)
        name: worker.name || worker.email || `Técnico ${worker.id}`,
        // Asegurar que tenga un rol (asumir WORKER si no hay rol)
        role: worker.role || "WORKER",
        // Asegurar que tenga un email
        email: worker.email || "",
      }));
      setProcessedWorkers(processed);
      console.log("Workers procesados:", processed);
    } else {
      setProcessedWorkers([]);
      console.log("No hay workers para procesar");
    }
  }, [workers]);

  const handleAddUser = async (userData: User) => {
    try {
      setIsCreatingUser(true);
      // Asegurar que el rol sea WORKER
      userData.role = "WORKER";

      // Extraer solo los campos necesarios para el registro
      const response = await register(
        userData.name,
        userData.email,
        userData.password || ""
      );

      if (response.success && response.data) {
        // Crear un objeto User con los datos devueltos
        const newUser: User = {
          id: response.data.user.id,
          name: userData.name,
          email: userData.email,
          role: "WORKER",
          createdAt: response.data.user.createdAt,
          updatedAt: response.data.user.updatedAt,
        };

        // Si existe la función para notificar la creación de un usuario
        if (onUserCreated) {
          onUserCreated(newUser);
        }

        // Seleccionar el usuario recién creado
        onValueChange(newUser.id.toString(), newUser);
        addNotification("success", "Técnico creado correctamente");
        setIsAddingUser(false);
      } else {
        throw new Error(response.error || "Error al crear el técnico");
      }
    } catch (error) {
      console.error("Error al crear técnico:", error);
      addNotification("error", "Error al crear el técnico");
    } finally {
      setIsCreatingUser(false);
    }
  };

  return (
    <>
      <div className="flex gap-2 items-center">
        <Select
          value={value}
          onValueChange={(val) => {
            if (val === "new") {
              setIsAddingUser(true);
              return;
            }

            // Si seleccionamos sin asignar
            if (val === "-") {
              onValueChange("");
              return;
            }

            // Encontrar el worker correspondiente por ID
            const selectedWorker = processedWorkers.find(
              (w) => w.id.toString() === val
            );
            onValueChange(val, selectedWorker);
          }}
          className="flex-1"
          disabled={isLoading || isCreatingUser}
        >
          <SelectTrigger>
            {isLoading ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                <span>Cargando técnicos...</span>
              </div>
            ) : (
              <SelectValue placeholder={placeholder} />
            )}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="-">Sin asignar</SelectItem>
            <SelectItem value="new">
              <div className="flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                Crear nuevo técnico
              </div>
            </SelectItem>
            {processedWorkers && processedWorkers.length > 0 ? (
              processedWorkers.map((worker) => (
                <SelectItem key={worker.id} value={worker.id.toString()}>
                  {worker.name || worker.email || `Técnico ${worker.id}`}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="empty" disabled>
                No hay técnicos disponibles
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Formulario para crear nuevo técnico */}
      <UserForm
        isOpen={isAddingUser}
        user={null}
        onSave={handleAddUser}
        onClose={() => setIsAddingUser(false)}
        isLoading={isCreatingUser}
      />
    </>
  );
}
