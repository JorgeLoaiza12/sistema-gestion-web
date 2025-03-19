import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
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
}

export default function ClientSelect({
  clients,
  value,
  onValueChange,
  onClientCreated,
  placeholder = "Seleccionar cliente",
}: ClientSelectProps) {
  const [isAddingClient, setIsAddingClient] = useState(false);
  const { addNotification } = useNotification();

  const handleAddClient = async (clientData: Client) => {
    try {
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
            onValueChange(val);
          }}
          className="flex-1"
        >
          <SelectTrigger>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="-">Sin cliente</SelectItem>
            <SelectItem value="new">
              <div className="flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                Crear nuevo cliente
              </div>
            </SelectItem>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id.toString()}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Formulario para crear nuevo cliente */}
      <ClientForm
        isOpen={isAddingClient}
        customer={null}
        onSave={handleAddClient}
        onCancel={() => setIsAddingClient(false)}
      />
    </>
  );
}
