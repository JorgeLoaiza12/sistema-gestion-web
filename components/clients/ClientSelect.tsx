// web\components\clients\ClientSelect.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Client, createClient } from "@/services/clients";
import { useNotification } from "@/contexts/NotificationContext";
import ClientForm from "@/components/clients/ClientForm";

interface ClientSelectProps {
  clients: Client[];
  value: string;
  onValueChange: (value: string, client?: Client) => void;
  onClientCreated?: (client: Client) => void;
  placeholder?: string;
  isLoading?: boolean;
}

export default function ClientSelect({
  clients,
  value,
  onValueChange,
  onClientCreated,
  placeholder = "Seleccionar cliente",
  isLoading = false,
}: ClientSelectProps) {
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const { addNotification } = useNotification();

  const handleAddClient = async (clientData: Client) => {
    try {
      setIsCreatingClient(true);
      const newClient = await createClient(clientData);

      // Notificar al componente padre sobre el nuevo cliente
      if (onClientCreated) {
        onClientCreated(newClient);
      }

      // Seleccionar el cliente recién creado
      onValueChange(newClient.id.toString(), newClient);

      addNotification("success", "Cliente creado correctamente");
      setIsAddingClient(false);
    } catch (error) {
      console.error("Error al crear cliente:", error);
      addNotification("error", "Error al crear el cliente");
    } finally {
      setIsCreatingClient(false);
    }
  };

  return (
    <>
      <div className="flex gap-2 items-center">
        <Select
          value={value}
          onValueChange={(val) => {
            if (val === "new") {
              setIsAddingClient(true);
              return;
            }

            // Encontrar el cliente seleccionado
            const selectedClient = clients.find(
              (client) => client.id.toString() === val
            );

            onValueChange(val, selectedClient);
          }}
          className="flex-1"
          disabled={isLoading || isCreatingClient}
        >
          <SelectTrigger>
            {isLoading ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                <span>Cargando clientes...</span>
              </div>
            ) : (
              <SelectValue placeholder={placeholder} />
            )}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="-">Sin cliente</SelectItem>
            <SelectItem value="new">
              <div className="flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                Crear nuevo cliente
              </div>
            </SelectItem>
            {clients.length > 0 ? (
              clients.map((client) => (
                <SelectItem key={client.id} value={client.id.toString()}>
                  {client.name}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="empty" disabled>
                No hay clientes disponibles
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Formulario para crear nuevo cliente */}
      <ClientForm
        isOpen={isAddingClient}
        customer={null}
        onSave={handleAddClient}
        onCancel={() => setIsAddingClient(false)}
        isLoading={isCreatingClient}
      />
    </>
  );
}

