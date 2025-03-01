// app/(dashboard)/dashboard/customers/page.tsx
"use client";

import { useState } from "react";
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

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([
    {
      id: "1",
      name: "Cliente 1",
      email: "cliente1@example.com",
      phone: "123456789",
    },
    {
      id: "2",
      name: "Cliente 2",
      email: "cliente2@example.com",
      phone: "987654321",
    },
  ]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);

  const handleAddCustomer = () => {
    setIsEditing(true);
    setCurrentCustomer(null);
  };

  const handleEditCustomer = (customer: Customer) => {
    setIsEditing(true);
    setCurrentCustomer(customer);
  };

  const handleDeleteCustomer = (id: string) => {
    setCustomers(customers.filter((customer) => customer.id !== id));
  };

  const handleSaveCustomer = (customer: Customer) => {
    if (currentCustomer) {
      setCustomers(customers.map((c) => (c.id === customer.id ? customer : c)));
    } else {
      setCustomers([
        ...customers,
        { ...customer, id: String(customers.length + 1) },
      ]);
    }
    setIsEditing(false);
  };

  const columns: ColumnDef<Customer>[] = [
    { accessorKey: "name", header: "Nombre" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "phone", header: "Teléfono" },
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
            onClick={() => handleDeleteCustomer(row.original.id)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

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
          <Button onClick={handleAddCustomer}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar Cliente
          </Button>
        </div>
        <DataTable columns={columns} data={customers} />
      </Card>
      {isEditing && (
        <CustomerForm
          customer={currentCustomer}
          onSave={handleSaveCustomer}
          onCancel={() => setIsEditing(false)}
        />
      )}
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: customer?.id || "",
      name,
      email,
      phone,
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
