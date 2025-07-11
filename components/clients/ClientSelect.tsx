"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Check, ChevronsUpDown, Loader2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Client, createClient } from "@/services/clients";
import { CustomerForm } from "@/components/clients/CustomerForm";
import { cn } from "@/lib/utils";
import { useNotification } from "@/contexts/NotificationContext";

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
  placeholder = "Seleccionar o buscar cliente...",
  isLoading = false,
}: ClientSelectProps) {
  const [open, setOpen] = useState(false);
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addNotification } = useNotification();

  const handleSaveNewClient = async (clientData: Client) => {
    setIsSubmitting(true);
    try {
      const response = await createClient(clientData);
      const newClient = response.client || (response as unknown as Client);

      if (!newClient || !newClient.id) {
        throw new Error(
          "La respuesta del servidor no incluyó un cliente válido."
        );
      }

      // Notificar al componente padre que se creó un nuevo cliente para que actualice su lista
      if (onClientCreated) {
        onClientCreated(newClient);
      }

      // Seleccionar automáticamente el cliente recién creado
      onValueChange(newClient.id.toString(), newClient);

      addNotification("success", "Cliente creado correctamente");
      setIsAddingClient(false); // Cierra el modal de creación
    } catch (error) {
      console.error("Error al crear el nuevo cliente:", error);
      addNotification(
        "error",
        `Error al crear el cliente: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedClientName =
    clients.find((c) => c.id?.toString() === value)?.name || placeholder;

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={isLoading}
          >
            <span className="truncate">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                selectedClientName
              )}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput placeholder="Buscar cliente por nombre..." />
            <CommandList style={{ maxHeight: "250px" }}>
              <CommandEmpty>
                <div className="py-2 px-3 text-center text-sm">
                  <p className="mb-2">No se encontró el cliente.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setIsAddingClient(true);
                      setOpen(false);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Crear Nuevo Cliente
                  </Button>
                </div>
              </CommandEmpty>
              <CommandGroup>
                {clients.map((client) => (
                  <CommandItem
                    key={client.id}
                    value={client.name}
                    onSelect={() => {
                      onValueChange(client.id!.toString(), client);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === client.id!.toString()
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    <span>{client.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>

              <div className="p-1 border-t mt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsAddingClient(true);
                    setOpen(false);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Nuevo Cliente
                </Button>
              </div>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {isAddingClient && (
        <CustomerForm
          customer={null}
          onSave={handleSaveNewClient}
          onCancel={() => setIsAddingClient(false)}
          isSubmitting={isSubmitting}
        />
      )}
    </>
  );
}
