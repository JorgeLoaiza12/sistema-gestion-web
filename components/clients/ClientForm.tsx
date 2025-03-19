import { useState, useEffect } from "react";
import { FormField, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormTextarea } from "@/components/ui/form-textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Client } from "@/services/clients";

interface ClientFormProps {
  isOpen: boolean;
  customer: Client | null;
  onSave: (client: Client) => Promise<void>;
  onCancel: () => void;
}

export default function ClientForm({
  isOpen,
  customer,
  onSave,
  onCancel,
}: ClientFormProps) {
  const [formData, setFormData] = useState<Client>({
    id: "",
    name: "",
    email: "",
    phone: "",
    rut: "",
    address: "",
    commune: "",
    administrator: "",
    butler: "",
    notes: "",
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        ...customer,
      });
    } else {
      // Reset form for new client
      setFormData({
        id: "",
        name: "",
        email: "",
        phone: "",
        rut: "",
        address: "",
        commune: "",
        administrator: "",
        butler: "",
        notes: "",
      });
    }
  }, [customer, isOpen]);

  const handleSubmit = async () => {
    await onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {customer ? "Editar Cliente" : "Nuevo Cliente"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <FormField>
            <FormLabel>Nombre</FormLabel>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </FormField>

          <FormField>
            <FormLabel>Email</FormLabel>
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
            <FormLabel>Teléfono</FormLabel>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              required
            />
          </FormField>

          <FormField>
            <FormLabel>RUT</FormLabel>
            <Input
              value={formData.rut || ""}
              onChange={(e) =>
                setFormData({ ...formData, rut: e.target.value })
              }
            />
          </FormField>

          <FormField>
            <FormLabel>Dirección</FormLabel>
            <Input
              value={formData.address || ""}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
            />
          </FormField>

          <FormField>
            <FormLabel>Comuna</FormLabel>
            <Input
              value={formData.commune || ""}
              onChange={(e) =>
                setFormData({ ...formData, commune: e.target.value })
              }
            />
          </FormField>

          <FormField>
            <FormLabel>Administrador</FormLabel>
            <Input
              value={formData.administrator || ""}
              onChange={(e) =>
                setFormData({ ...formData, administrator: e.target.value })
              }
            />
          </FormField>

          <FormField>
            <FormLabel>Conserje</FormLabel>
            <Input
              value={formData.butler || ""}
              onChange={(e) =>
                setFormData({ ...formData, butler: e.target.value })
              }
            />
          </FormField>

          <FormField>
            <FormLabel>Notas</FormLabel>
            <FormTextarea
              value={formData.notes || ""}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
            />
          </FormField>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
