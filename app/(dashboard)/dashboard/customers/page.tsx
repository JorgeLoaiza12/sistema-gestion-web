"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable, type ColumnDef } from "@/components/ui/table";
import { FormField, FormLabel } from "@/components/ui/form";
import { Plus, Trash, Edit } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormTextarea } from "@/components/ui/form-textarea";
import {
  getClients,
  createClient,
  updateClient,
  deleteClient,
} from "@/services/clients";

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

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(
    null
  );
  const [isDeletingCustomer, setIsDeletingCustomer] = useState(false);

  // Obtener clientes del backend al cargar el componente
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const data = await getClients();
        setCustomers(data);
      } catch (err) {
        setError("Error al cargar los clientes");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  const handleAddCustomer = () => {
    setIsEditing(true);
    setCurrentCustomer(null);
  };

  const handleEditCustomer = (customer: Customer) => {
    setIsEditing(true);
    setCurrentCustomer(customer);
  };

  const openDeleteConfirm = (customer: Customer) => {
    setCustomerToDelete(customer);
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;

    try {
      setIsDeletingCustomer(true);
      await deleteClient(customerToDelete.id);
      setCustomers(
        customers.filter((customer) => customer.id !== customerToDelete.id)
      );
      setError(null);
    } catch (err) {
      setError("Error al eliminar el cliente");
      console.error(err);
    } finally {
      setIsDeletingCustomer(false);
      setCustomerToDelete(null);
    }
  };

  const handleSaveCustomer = async (customer: Customer) => {
    try {
      if (currentCustomer) {
        // Editar cliente existente
        const updatedCustomer = await updateClient(customer.id, customer);
        setCustomers(
          customers.map((c) => (c.id === customer.id ? updatedCustomer : c))
        );
      } else {
        // Crear nuevo cliente
        const newCustomer = await createClient(customer);
        setCustomers([...customers, newCustomer]);
      }
      setIsEditing(false);
      setError(null);
    } catch (err) {
      setError("Error al guardar el cliente");
      console.error(err);
    }
  };

  const columns: ColumnDef<Customer>[] = [
    { accessorKey: "name", header: "Nombre" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "phone", header: "Teléfono" },
    { accessorKey: "address", header: "Dirección" },
    { accessorKey: "commune", header: "Comuna" },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditCustomer(row.original)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openDeleteConfirm(row.original)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  // Filtrar clientes por nombre
  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-content-emphasis">Clientes</h1>
        <p className="text-content-subtle mt-2">
          Administra tus clientes y sus datos
        </p>
      </div>
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Lista de Clientes</h2>
          <div className="flex items-center gap-4">
            <Input
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
            <Button onClick={handleAddCustomer}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Cliente
            </Button>
          </div>
        </div>
        {isLoading ? (
          <div className="text-center h-96 flex items-center justify-center">
            <p>Cargando clientes...</p>
          </div>
        ) : (
          <DataTable columns={columns} data={filteredCustomers} />
        )}
      </Card>

      {isEditing && (
        <CustomerForm
          customer={currentCustomer}
          onSave={handleSaveCustomer}
          onCancel={() => setIsEditing(false)}
        />
      )}

      {error && <div className="text-center text-red-500">{error}</div>}

      <ConfirmDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        title="Eliminar Cliente"
        description={`¿Estás seguro que deseas eliminar al cliente "${customerToDelete?.name}"? Esta acción no se puede deshacer.`}
        onConfirm={handleDeleteCustomer}
        confirmLabel="Eliminar"
        isLoading={isDeletingCustomer}
      />
    </div>
  );
}

interface CustomerFormProps {
  customer: Customer | null;
  onSave: (customer: Customer) => void;
  onCancel: () => void;
}

function CustomerForm({ customer, onSave, onCancel }: CustomerFormProps) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
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
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {customer ? "Editar Cliente" : "Agregar Cliente"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </FormField>
          <FormField>
            <FormLabel>Comuna</FormLabel>
            <Input
              value={commune}
              onChange={(e) => setCommune(e.target.value)}
            />
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
          <FormField>
            <FormLabel>Notas</FormLabel>
            <FormTextarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </FormField>
          <DialogFooter className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit">Guardar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
