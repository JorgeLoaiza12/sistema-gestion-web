"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable, type ColumnDef } from "@/components/ui/table";
import { Plus, Trash, Edit } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  getClients,
  createClient,
  updateClient,
  deleteClient,
} from "@/services/clients";
import { CustomerForm } from "@/components/clients/CustomerForm";
import { EmailBadge } from "@/components/clients/EmailBadge";

interface Customer {
  id: string;
  name: string;
  email: string;
  emailSecondary?: string;
  emailTertiary?: string;
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
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setError(null);
  };

  const handleEditCustomer = (customer: Customer) => {
    setIsEditing(true);
    setCurrentCustomer(customer);
    setError(null);
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
      setIsDeleteConfirmOpen(false);
    }
  };

  const handleSaveCustomer = async (customer: Customer) => {
    try {
      setIsSubmitting(true);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  // Componente para mostrar emails con badge
  const EmailsDisplay = ({ customer }: { customer: Customer }) => {
    const emails = [
      customer.email,
      customer.emailSecondary,
      customer.emailTertiary
    ].filter(email => email && email.trim() !== "");
    
    return (
      <div className="flex items-center">
        <span>{customer.email}</span>
        <EmailBadge emails={emails} />
      </div>
    );
  };

  const columns: ColumnDef<Customer>[] = [
    { accessorKey: "name", header: "Nombre" },
    { 
      id: "emails",
      header: "Correos",
      cell: ({ row }) => <EmailsDisplay customer={row.original} />
    },
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

  // Filtrar clientes por nombre o por cualquiera de los tres emails
  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.emailSecondary && customer.emailSecondary.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (customer.emailTertiary && customer.emailTertiary.toLowerCase().includes(searchTerm.toLowerCase()))
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
              placeholder="Buscar por nombre o email..."
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
          isSubmitting={isSubmitting}
          error={error}
        />
      )}

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