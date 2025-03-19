import { useState } from "react";
import { FormField, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { EntityForm } from "@/components/ui/entity-form";
import { FormTextarea } from "@/components/ui/form-textarea";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  rut?: string;
  address?: string;
  commune?: string;
  administrator?: string;
  butler?: string;
  notes?: string;
}

interface CustomerFormProps {
  customer: Customer | null;
  onSave: (customer: Customer) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  error?: string | null;
}

export function CustomerForm({
  customer,
  onSave,
  onCancel,
  isSubmitting = false,
  error = null,
}: CustomerFormProps) {
  const [name, setName] = useState(customer?.name || "");
  const [email, setEmail] = useState(customer?.email || "");
  const [phone, setPhone] = useState(customer?.phone || "");
  const [address, setAddress] = useState(customer?.address || "");
  const [commune, setCommune] = useState(customer?.commune || "");
  const [rut, setRut] = useState(customer?.rut || "");
  const [administrator, setAdministrator] = useState(
    customer?.administrator || ""
  );
  const [butler, setButler] = useState(customer?.butler || "");
  const [notes, setNotes] = useState(customer?.notes || "");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSave({
      id: customer?.id || "",
      name,
      email,
      phone,
      rut,
      address,
      commune,
      administrator,
      butler,
      notes,
    });
  };

  return (
    <EntityForm
      isOpen={true}
      onClose={onCancel}
      onSubmit={handleSubmit}
      title={customer ? "Editar Cliente" : "Agregar Cliente"}
      isLoading={isSubmitting}
      error={error}
      maxWidth="max-w-2xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField>
          <FormLabel>Nombre</FormLabel>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </FormField>
        <FormField>
          <FormLabel>Email</FormLabel>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </FormField>
        <FormField>
          <FormLabel>Teléfono</FormLabel>
          <Input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </FormField>
        <FormField>
          <FormLabel>RUT</FormLabel>
          <Input value={rut} onChange={(e) => setRut(e.target.value)} />
        </FormField>
        <FormField>
          <FormLabel>Dirección</FormLabel>
          <Input value={address} onChange={(e) => setAddress(e.target.value)} />
        </FormField>
        <FormField>
          <FormLabel>Comuna</FormLabel>
          <Input value={commune} onChange={(e) => setCommune(e.target.value)} />
        </FormField>
        <FormField>
          <FormLabel>Administrador</FormLabel>
          <Input
            value={administrator}
            onChange={(e) => setAdministrator(e.target.value)}
          />
        </FormField>
        <FormField>
          <FormLabel>Conserje</FormLabel>
          <Input value={butler} onChange={(e) => setButler(e.target.value)} />
        </FormField>
      </div>

      <FormField>
        <FormLabel>Notas</FormLabel>
        <FormTextarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </FormField>
    </EntityForm>
  );
}
