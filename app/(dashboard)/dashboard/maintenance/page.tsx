// app/(dashboard)/dashboard/maintenance/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable, type ColumnDef } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNotification } from "@/contexts/NotificationContext";
import {
  getAllMaintenances,
  getUpcomingMaintenances,
  createMaintenance,
  updateMaintenance,
  deleteMaintenance,
  getMaintenancesByClient, // Importar la nueva función
  type Maintenance,
} from "@/services/maintenance";
import ClientSelect from "@/components/clients/ClientSelect";
import {
  Plus,
  Search,
  Calendar as CalendarIconLucide, // Renombrar para evitar conflicto
  Edit,
  Trash,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  RefreshCcw,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/utils/date-format";
import {
  calculateNextMaintenanceDate,
  getMaintenanceStatus,
} from "@/utils/maintenance-utils";
import { getClients, Client } from "@/services/clients"; // Importar Client

export default function MaintenancePage() {
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [filteredMaintenances, setFilteredMaintenances] = useState<
    Maintenance[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"all" | "upcoming">("all");
  const [upcomingDays, setUpcomingDays] = useState(30);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMaintenance, setCurrentMaintenance] =
    useState<Maintenance | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [maintenanceToDelete, setMaintenanceToDelete] =
    useState<Maintenance | null>(null);
  const { addNotification } = useNotification();
  const [allClients, setAllClients] = useState<Client[]>([]); // Para el filtro de cliente
  const [selectedClientFilter, setSelectedClientFilter] = useState<
    string | undefined
  >(undefined); // Para el filtro
  const [isLoadingClients, setIsLoadingClients] = useState(true);

  useEffect(() => {
    const loadClients = async () => {
      setIsLoadingClients(true);
      try {
        const clientsData = await getClients();
        setAllClients(clientsData || []);
      } catch (error) {
        console.error("Error al cargar clientes para filtro:", error);
        addNotification("error", "Error al cargar lista de clientes");
      } finally {
        setIsLoadingClients(false);
      }
    };
    loadClients();
  }, [addNotification]);

  useEffect(() => {
    fetchMaintenances();
  }, [viewMode, upcomingDays, selectedClientFilter]); // Añadir selectedClientFilter a las dependencias

  useEffect(() => {
    const filtered = maintenances.filter(
      (m) =>
        (m.client?.name || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (m.notes || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredMaintenances(filtered);
  }, [searchTerm, maintenances]);

  const fetchMaintenances = async () => {
    setIsLoading(true);
    try {
      let data;
      if (selectedClientFilter && selectedClientFilter !== "ALL") {
        data = await getMaintenancesByClient(selectedClientFilter);
      } else if (viewMode === "upcoming") {
        data = await getUpcomingMaintenances(upcomingDays);
      } else {
        data = await getAllMaintenances();
      }
      setMaintenances(data);
      setFilteredMaintenances(data); // Actualizar también aquí
      // addNotification("success", "Mantenimientos cargados correctamente"); // Puede ser muy ruidoso
    } catch (error) {
      console.error("Error al cargar mantenimientos:", error);
      addNotification("error", "Error al cargar mantenimientos");
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (maintenance?: Maintenance) => {
    setCurrentMaintenance(maintenance || null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentMaintenance(null);
  };

  const handleDelete = async () => {
    if (!maintenanceToDelete || !maintenanceToDelete.id) return;
    setIsDeleting(true);
    try {
      await deleteMaintenance(maintenanceToDelete.id.toString());
      setMaintenances((prev) =>
        prev.filter((m) => m.id !== maintenanceToDelete.id)
      );
      // setFilteredMaintenances((prev) => prev.filter((m) => m.id !== maintenanceToDelete.id)); // Se actualiza por el useEffect
      addNotification("success", "Mantenimiento eliminado correctamente");
    } catch (error) {
      addNotification("error", "Error al eliminar mantenimiento");
    } finally {
      setIsDeleting(false);
      setMaintenanceToDelete(null);
    }
  };

  const handleFormSubmit = async (maintenanceData: Maintenance) => {
    try {
      if (currentMaintenance && currentMaintenance.id) {
        const response = await updateMaintenance(
          currentMaintenance.id.toString(),
          maintenanceData
        );
        setMaintenances((prev) =>
          prev.map((m) =>
            m.id === currentMaintenance.id ? response.maintenance : m
          )
        );
        addNotification("success", "Mantenimiento actualizado");
      } else {
        const response = await createMaintenance(maintenanceData);
        setMaintenances((prev) => [...prev, response.maintenance]);
        addNotification("success", "Mantenimiento creado");
      }
      closeModal();
      fetchMaintenances(); // Recargar la lista después de guardar
    } catch (error) {
      addNotification("error", "Error al guardar mantenimiento");
    }
  };

  const getStatusBadge = (nextDate: string) => {
    const status = getMaintenanceStatus(nextDate);
    switch (status) {
      case "overdue":
        return (
          <div className="flex items-center gap-1 text-error">
            <AlertTriangle className="h-4 w-4" /> <span>Vencido</span>
          </div>
        );
      case "urgent":
        return (
          <div className="flex items-center gap-1 text-warning">
            <Clock className="h-4 w-4" /> <span>Urgente</span>
          </div>
        );
      case "upcoming":
        return (
          <div className="flex items-center gap-1 text-info">
            <CalendarIconLucide className="h-4 w-4" /> <span>Próximo</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1 text-success">
            <CheckCircle className="h-4 w-4" /> <span>Programado</span>
          </div>
        );
    }
  };

  const columns: ColumnDef<Maintenance>[] = [
    {
      accessorKey: "client",
      header: "Cliente",
      cell: ({ row }) => (
        <span>{row.original.client?.name || "Sin cliente"}</span>
      ),
    },
    {
      accessorKey: "lastMaintenanceDate",
      header: "Último mantenimiento",
      cell: ({ row }) => (
        <span>{formatDate(row.original.lastMaintenanceDate)}</span>
      ),
    },
    {
      accessorKey: "nextMaintenanceDate",
      header: "Próximo mantenimiento",
      cell: ({ row }) => (
        <span>{formatDate(row.original.nextMaintenanceDate)}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => getStatusBadge(row.original.nextMaintenanceDate),
    },
    {
      accessorKey: "frequency",
      header: "Frecuencia",
      cell: ({ row }) => {
        const frequencyMap: Record<string, string> = {
          MENSUAL: "Mensual",
          BIMESTRAL: "Bimestral",
          TRIMESTRAL: "Trimestral",
          SEMESTRAL: "Semestral",
          ANUAL: "Anual",
        };
        return (
          <span>
            {frequencyMap[row.original.frequency] || row.original.frequency}
          </span>
        );
      },
    },
    {
      accessorKey: "notes",
      header: "Notas",
      cell: ({ row }) => (
        <span className="truncate max-w-xs">{row.original.notes}</span>
      ),
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openModal(row.original)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMaintenanceToDelete(row.original)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const MaintenanceForm = ({
    maintenance,
    onSave,
    onCancel,
  }: {
    maintenance: Maintenance | null;
    onSave: (data: Maintenance) => void;
    onCancel: () => void;
  }) => {
    const [clientId, setClientId] = useState(
      maintenance ? maintenance.clientId.toString() : ""
    );
    const [lastMaintenanceDate, setLastMaintenanceDate] = useState(
      maintenance
        ? formatDate(maintenance.lastMaintenanceDate, "yyyy-MM-dd")
        : formatDate(new Date(), "yyyy-MM-dd")
    );
    const [nextMaintenanceDate, setNextMaintenanceDate] = useState(
      maintenance
        ? formatDate(maintenance.nextMaintenanceDate, "yyyy-MM-dd")
        : formatDate(
            new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            "yyyy-MM-dd"
          )
    );
    const [frequency, setFrequency] = useState<
      "MENSUAL" | "BIMESTRAL" | "TRIMESTRAL" | "SEMESTRAL" | "ANUAL"
    >(maintenance ? maintenance.frequency : "TRIMESTRAL");
    const [notes, setNotes] = useState(
      maintenance ? maintenance.notes || "" : ""
    );
    const [formClients, setFormClients] = useState<Client[]>([]); // Clientes para el select dentro del formulario
    const [isLoadingFormClients, setIsLoadingFormClients] = useState(true);

    useEffect(() => {
      const loadFormClients = async () => {
        setIsLoadingFormClients(true);
        try {
          const clientsData = await getClients();
          setFormClients(clientsData || []);
        } catch (error) {
          addNotification(
            "error",
            "Error al cargar clientes para el formulario."
          );
        } finally {
          setIsLoadingFormClients(false);
        }
      };
      loadFormClients();
    }, [addNotification]);

    useEffect(() => {
      if (lastMaintenanceDate) {
        const nextDate = calculateNextMaintenanceDate(
          new Date(lastMaintenanceDate),
          frequency
        );
        setNextMaintenanceDate(formatDate(nextDate, "yyyy-MM-dd"));
      }
    }, [lastMaintenanceDate, frequency]);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!clientId) {
        addNotification("error", "Debes seleccionar un cliente");
        return;
      }
      if (!lastMaintenanceDate || !nextMaintenanceDate) {
        addNotification("error", "Las fechas son obligatorias");
        return;
      }
      const maintenanceData: Maintenance = {
        clientId: parseInt(clientId),
        lastMaintenanceDate,
        nextMaintenanceDate,
        frequency,
        notes,
      };
      if (maintenance && maintenance.taskIds) {
        maintenanceData.taskIds = maintenance.taskIds;
      }
      onSave(maintenanceData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-4">
          <div>
            <ClientSelect
              clients={formClients}
              value={clientId}
              onValueChange={(val) => setClientId(val)}
              placeholder="Seleccionar cliente"
              isLoading={isLoadingFormClients}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">
              Último mantenimiento
            </label>
            <Input
              type="date"
              value={lastMaintenanceDate}
              onChange={(e) => setLastMaintenanceDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Frecuencia</label>
            <Select
              value={frequency}
              onValueChange={(
                val:
                  | "MENSUAL"
                  | "BIMESTRAL"
                  | "TRIMESTRAL"
                  | "SEMESTRAL"
                  | "ANUAL"
              ) => setFrequency(val)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar frecuencia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MENSUAL">Mensual</SelectItem>
                <SelectItem value="BIMESTRAL">Bimestral</SelectItem>
                <SelectItem value="TRIMESTRAL">Trimestral</SelectItem>
                <SelectItem value="SEMESTRAL">Semestral</SelectItem>
                <SelectItem value="ANUAL">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium">
              Próximo mantenimiento
            </label>
            <Input
              type="date"
              value={nextMaintenanceDate}
              onChange={(e) => setNextMaintenanceDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Notas</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border rounded-md p-2 min-h-[100px]"
              placeholder="Notas adicionales..."
            />
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">Guardar</Button>
        </div>
      </form>
    );
  };

  if (isLoading && !maintenances.length) {
    // Mostrar loader principal solo si no hay mantenimientos y se está cargando
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Mantenimientos</h1>
          <p className="text-content-subtle mt-1">
            Gestiona los mantenimientos programados
          </p>
        </div>
        <div className="h-[500px] w-full flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
          <p>Cargando mantenimientos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Mantenimientos</h1>
          <p className="text-content-subtle mt-1">
            Gestiona los mantenimientos programados
          </p>
        </div>
        <Button onClick={() => openModal()} disabled={isLoadingClients}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Mantenimiento
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 md:w-64">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por cliente o notas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Filtro por Cliente */}
          <Select
            value={selectedClientFilter || "ALL"}
            onValueChange={(value) =>
              setSelectedClientFilter(value === "ALL" ? undefined : value)
            }
            disabled={isLoadingClients || isLoading}
          >
            <SelectTrigger className="w-full md:w-52">
              {isLoadingClients ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SelectValue placeholder="Filtrar por cliente" />
              )}
            </SelectTrigger>
            <SelectContent style={{ maxHeight: "300px", overflowY: "auto" }}>
              <SelectItem value="ALL">Todos los clientes</SelectItem>
              {allClients.map((client) => (
                <SelectItem key={client.id} value={client.id!.toString()}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={viewMode}
            onValueChange={(val: "all" | "upcoming") => setViewMode(val)}
            disabled={isLoading}
          >
            <SelectTrigger className="w-full md:w-44">
              <SelectValue placeholder="Modo de vista" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="upcoming">Próximos</SelectItem>
            </SelectContent>
          </Select>

          {viewMode === "upcoming" && (
            <Select
              value={upcomingDays.toString()}
              onValueChange={(val) => setUpcomingDays(parseInt(val))}
              disabled={isLoading}
            >
              <SelectTrigger className="w-full md:w-44">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Próximos 7 días</SelectItem>
                <SelectItem value="15">Próximos 15 días</SelectItem>
                <SelectItem value="30">Próximos 30 días</SelectItem>
                <SelectItem value="60">Próximos 60 días</SelectItem>
                <SelectItem value="90">Próximos 90 días</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
        <Button
          variant="outline"
          onClick={fetchMaintenances}
          className="self-start"
          disabled={isLoading}
        >
          <RefreshCcw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      <Card>
        <DataTable
          columns={columns}
          data={filteredMaintenances}
          isLoading={isLoading}
        />
      </Card>

      <ConfirmDialog
        open={!!maintenanceToDelete}
        onOpenChange={(open) => {
          if (!open) setMaintenanceToDelete(null);
        }}
        title="Eliminar Mantenimiento"
        description={`¿Estás seguro de eliminar el mantenimiento del cliente ${maintenanceToDelete?.client?.name}?`}
        onConfirm={handleDelete}
        confirmLabel="Eliminar"
        isLoading={isDeleting}
      />

      {isModalOpen && (
        <Dialog
          open={isModalOpen}
          onOpenChange={(open) => {
            if (!open) closeModal();
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {currentMaintenance
                  ? "Editar Mantenimiento"
                  : "Nuevo Mantenimiento"}
              </DialogTitle>
            </DialogHeader>
            <MaintenanceForm
              maintenance={currentMaintenance}
              onSave={handleFormSubmit}
              onCancel={closeModal}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
