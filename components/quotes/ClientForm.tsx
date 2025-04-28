// web\components\quotes\ClientForm.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField, FormLabel } from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Client, createClient } from "@/services/clients";

interface ClientFormProps {
  isOpen: boolean;
  onClose: () => void;
  onClientCreated: (client: Client) => void;
}

export default function ClientForm({
  isOpen,
  onClose,
  onClientCreated,
}: ClientFormProps) {
  const [newClient, setNewClient] = useState<Client>({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  });
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateClient = async () => {
    if (!newClient.name || !newClient.email) {
      setError("El nombre y email son obligatorios");
      return;
    }

    try {
      setIsCreating(true);
      const createdClient = await createClient(newClient);

      console.log("Cliente creado en el backend:", createdClient);

      // Verificar que el cliente tenga un ID válido
      if (!createdClient || !createdClient.id) {
        throw new Error("El servidor no devolvió un ID válido para el cliente");
      }

      // Asegurarse de que el cliente tenga el tipo correcto
      const clientWithCorrectId = {
        ...createdClient,
        id: createdClient.id.toString(),
      };

      onClientCreated(clientWithCorrectId);
      resetForm();
    } catch (err) {
      console.error("Error al crear cliente:", err);
      setError("Error al crear el cliente. Por favor, intenta de nuevo.");
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setNewClient({
      name: "",
      email: "",
      phone: "",
      address: "",
      notes: "",
    });
    setError(null);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          resetForm();
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear Nuevo Cliente</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <FormField>
            <FormLabel>Nombre *</FormLabel>
            <Input
              value={newClient.name}
              onChange={(e) =>
                setNewClient({ ...newClient, name: e.target.value })
              }
              placeholder="Nombre del cliente"
              required
            />
          </FormField>

          <FormField>
            <FormLabel>Email *</FormLabel>
            <Input
              type="email"
              value={newClient.email}
              onChange={(e) =>
                setNewClient({ ...newClient, email: e.target.value })
              }
              placeholder="Email del cliente"
              required
            />
          </FormField>

          <FormField>
            <FormLabel>Teléfono</FormLabel>
            <Input
              value={newClient.phone || ""}
              onChange={(e) =>
                setNewClient({ ...newClient, phone: e.target.value })
              }
              placeholder="Teléfono"
            />
          </FormField>

          <FormField>
            <FormLabel>Dirección</FormLabel>
            <Input
              value={newClient.address || ""}
              onChange={(e) =>
                setNewClient({ ...newClient, address: e.target.value })
              }
              placeholder="Dirección"
            />
          </FormField>

          <FormField>
            <FormLabel>Notas</FormLabel>
            <Input
              value={newClient.notes || ""}
              onChange={(e) =>
                setNewClient({ ...newClient, notes: e.target.value })
              }
              placeholder="Notas adicionales"
            />
          </FormField>

          {error && <div className="text-red-500 text-sm">{error}</div>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isCreating}>
            Cancelar
          </Button>
          <Button onClick={handleCreateClient} disabled={isCreating}>
            {isCreating ? "Creando..." : "Crear Cliente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
