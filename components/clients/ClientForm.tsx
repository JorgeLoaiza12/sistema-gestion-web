import { useState, useEffect } from "react";
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
import { FormTextarea } from "@/components/ui/form-textarea";
import { Client } from "@/services/clients";
import { Loader2 } from "lucide-react";

interface ClientFormProps {
  isOpen: boolean;
  customer: Client | null;
  onSave: (client: Client) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ClientForm({
  isOpen,
  customer,
  onSave,
  onCancel,
  isLoading = false,
}: ClientFormProps) {
  const [clientForm, setClientForm] = useState<Client>({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  });

  useEffect(() => {
    if (customer) {
      setClientForm({
        ...customer,
      });
    } else {
      // Reset form for new client
      setClientForm({
        name: "",
        email: "",
        phone: "",
        address: "",
        notes: "",
      });
    }
  }, [customer, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(clientForm);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {customer ? "Editar Cliente" : "Nuevo Cliente"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField>
            <FormLabel>Nombre</FormLabel>
            <Input
              value={clientForm.name}
              onChange={(e) =>
                setClientForm({ ...clientForm, name: e.target.value })
              }
              required
              disabled={isLoading}
              className="relative"
            />
          </FormField>

          <FormField>
            <FormLabel>Email</FormLabel>
            <Input
              type="email"
              value={clientForm.email || ""}
              onChange={(e) =>
                setClientForm({ ...clientForm, email: e.target.value })
              }
              disabled={isLoading}
            />
          </FormField>

          <FormField>
            <FormLabel>Teléfono</FormLabel>
            <Input
              value={clientForm.phone || ""}
              onChange={(e) =>
                setClientForm({ ...clientForm, phone: e.target.value })
              }
              disabled={isLoading}
            />
          </FormField>

          <FormField>
            <FormLabel>Dirección</FormLabel>
            <Input
              value={clientForm.address || ""}
              onChange={(e) =>
                setClientForm({ ...clientForm, address: e.target.value })
              }
              disabled={isLoading}
            />
          </FormField>

          <FormField>
            <FormLabel>Notas</FormLabel>
            <FormTextarea
              value={clientForm.notes || ""}
              onChange={(e) =>
                setClientForm({ ...clientForm, notes: e.target.value })
              }
              disabled={isLoading}
            />
          </FormField>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {customer ? "Guardando..." : "Creando..."}
                </div>
              ) : customer ? (
                "Guardar cambios"
              ) : (
                "Crear cliente"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
