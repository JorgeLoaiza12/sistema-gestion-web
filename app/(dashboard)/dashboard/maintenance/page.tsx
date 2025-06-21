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
  DialogFooter,
} from "@/components/ui/dialog";
import { useNotification } from "@/contexts/NotificationContext";
import {
  getAllMaintenances,
  getUpcomingMaintenances,
  createMaintenance,
  updateMaintenance,
  deleteMaintenance,
  getMaintenancesByClient,
  scheduleNextMaintenance,
  type Maintenance,
} from "@/services/maintenance";
import ClientSelect from "@/components/clients/ClientSelect";
import {
  Plus,
  Search,
  Calendar as CalendarIconLucide,
  Edit,
  Trash,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  RefreshCcw,
  Wrench,
  ChevronRight,
  Eye,
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
import { getClients, Client } from "@/services/clients";
import { getUsers, User } from "@/services/users";
import TaskForm from "@/components/tasks/TaskForm";
import { Task, createTask as createTaskService } from "@/services/tasks";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

export default function MaintenancePage() {
  const router = useRouter();
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
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [selectedClientFilter, setSelectedClientFilter] = useState<
    string | undefined
  >(undefined);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [maintenanceForTask, setMaintenanceForTask] =
    useState<Maintenance | null>(null);
  const [workers, setWorkers] = useState<User[]>([]);
  const [isLoadingWorkers, setIsLoadingWorkers] = useState(true);
  const [isSchedulingNext, setIsSchedulingNext] = useState<number | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoadingClients(true);
      setIsLoadingWorkers(true);
      try {
        const clientsData = await getClients();
        setAllClients(clientsData || []);
      } catch (error) {
        console.error("Error al cargar clientes:", error);
        addNotification("error", "Error al cargar lista de clientes");
      } finally {
        setIsLoadingClients(false);
      }
      try {
        const workersData = await getUsers();
        setWorkers(workersData || []);
      } catch (error) {
        console.error("Error al cargar técnicos:", error);
        addNotification("error", "Error al cargar lista de técnicos");
      } finally {
        setIsLoadingWorkers(false);
      }
    };
    loadData();
  }, [addNotification]);

  useEffect(() => {
    fetchMaintenances();
  }, [viewMode, upcomingDays, selectedClientFilter]);

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
      setFilteredMaintenances(data);
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
      addNotification("success", "Mantenimiento eliminado correctamente");
    } catch (error) {
      addNotification("error", "Error al eliminar mantenimiento");
    } finally {
      setIsDeleting(false);
      setMaintenanceToDelete(null);
      setIsDeleteConfirmOpen(false);
    }
  };

  const handleFormSubmit = async (maintenanceData: Maintenance) => {
    try {
      if (currentMaintenance && currentMaintenance.id) {
        const response = await updateMaintenance(
          currentMaintenance.id.toString(),
          maintenanceData
        );
        if (response.maintenance) {
          setMaintenances((prev) =>
            prev.map((m) =>
              m.id === currentMaintenance.id ? response.maintenance : m
            )
          );
          addNotification("success", "Mantenimiento actualizado");
          closeModal();
          fetchMaintenances(); 
        } else {
          throw new Error("No se recibió el mantenimiento actualizado.");
        }
      } else {
        // Si estamos creando
        const response = await createMaintenance(maintenanceData);
        // Si la creación fue exitosa, añade a la lista y notifica
        if (response.maintenance) {
          setMaintenances((prev) => [...prev, response.maintenance]);
          addNotification("success", "Mantenimiento creado");
          closeModal();
          fetchMaintenances(); // Refrescar datos después de la creación
        } else {
          throw new Error("No se recibió el mantenimiento creado.");
        }
      }
    } catch (error) {
      console.error("Error al guardar mantenimiento:", error);
      addNotification(
        "error",
        `Error al guardar mantenimiento: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  const handleGenerateTask = (maintenance: Maintenance) => {
    setMaintenanceForTask(maintenance);
    setIsTaskFormOpen(true);
  };

  const handleSaveTask = async (taskData: Task) => {
    try {
      await createTaskService(taskData);
      addNotification("success", "Tarea de mantenimiento creada correctamente");
      setIsTaskFormOpen(false);
      setMaintenanceForTask(null);
      fetchMaintenances();
    } catch (error) {
      addNotification("error", "Error al crear la tarea de mantenimiento");
      console.error(error);
    }
  };

  const handleScheduleNext = async (maintenance: Maintenance) => {
    if (!maintenance.id) return;
    setIsSchedulingNext(maintenance.id);
    try {
      const response = await scheduleNextMaintenance(maintenance.id.toString());
      addNotification(
        "success",
        "Siguiente ciclo de mantenimiento programado."
      );
      await fetchMaintenances();
      // Abrir el modal de tarea con la fecha de la nueva mantención pre-llenada
      if (response.maintenance && response.maintenance.nextMaintenanceDate) {
        setMaintenanceForTask({
          ...response.maintenance,
          // Convertir la fecha a formato ISO (YYYY-MM-DD) para el campo de fecha del formulario
          startDate: new Date(response.maintenance.nextMaintenanceDate)
            .toISOString()
            .split("T")[0], // Usar startDate para TaskForm
        });
        setIsTaskFormOpen(true);
      }
    } catch (error) {
      addNotification(
        "error",
        "Error al programar el siguiente ciclo de mantenimiento."
      );
    } finally {
      setIsSchedulingNext(null);
    }
  };

  const getStatusBadge = (maintenance: Maintenance) => {
    // Si el estado en la BD es FINALIZADO, priorizar eso
    if (maintenance.state === "FINALIZADO") {
      return (
        <Badge variant="success" className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3" /> <span>Finalizado</span>
        </Badge>
      );
    }

    // Si el estado es PENDIENTE, usar la lógica de fechas
    const status = getMaintenanceStatus(maintenance.nextMaintenanceDate);
    switch (status) {
      case "overdue":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> <span>Vencido</span>
          </Badge>
        );
      case "urgent":
        return (
          <Badge variant="warning" className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> <span>Urgente</span>
          </Badge>
        );
      case "upcoming":
        return (
          <Badge variant="info" className="flex items-center gap-1">
            <CalendarIconLucide className="h-3 w-3" /> <span>Próximo</span>
          </Badge>
        );
      case "scheduled":
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <CalendarIconLucide className="h-3 w-3" /> <span>Programado</span>
          </Badge>
        );
      default:
        return <Badge variant="secondary">{maintenance.state}</Badge>;
    }
  };

  const columns: ColumnDef<Maintenance>[] = [
    {
      accessorKey: "client",
      header: "Cliente",
      cell: ({ row }) => <span>{row.original.client?.name || "N/A"}</span>,
    },
    {
      accessorKey: "lastMaintenanceDate",
      header: "Último",
      cell: ({ row }) => (
        <span>{formatDate(row.original.lastMaintenanceDate)}</span>
      ),
    },
    {
      accessorKey: "nextMaintenanceDate",
      header: "Próximo",
      cell: ({ row }) => (
        <span>{formatDate(row.original.nextMaintenanceDate)}</span>
      ),
    },
    {
      accessorKey: "state",
      header: "Estado",
      cell: ({ row }) => getStatusBadge(row.original),
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
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => {
        const maintenance = row.original;
        const isScheduling = isSchedulingNext === maintenance.id;

        // Verificar si hay tareas activas (PENDIENTE o EN_CURSO) asociadas a este mantenimiento
        const hasActiveTask =
          Array.isArray(maintenance.tasks) &&
          maintenance.tasks.some(
            (task) => task.state === "PENDIENTE" || task.state === "EN_CURSO"
          );
        // Obtener la primera tarea activa para el botón "Ver Tarea"
        const firstActiveTask = Array.isArray(maintenance.tasks)
          ? maintenance.tasks.find(
              (task) => task.state === "PENDIENTE" || task.state === "EN_CURSO"
            )
          : undefined;

        // Verificar si ya existe un siguiente ciclo de mantenimiento PENDIENTE
        // (Esto evita que se puedan programar múltiples sucesores desde un mismo mantenimiento finalizado)
        const hasPendingSuccessor = maintenances.some(
          (m) =>
            m.clientId === maintenance.clientId &&
            m.state === "PENDIENTE" &&
            m.createdAt &&
            maintenance.createdAt && // Asegurar que createdAt no sea undefined
            new Date(m.createdAt) > new Date(maintenance.createdAt) &&
            m.notes?.includes(
              `Ciclo de seguimiento generado desde mantenimiento #${maintenance.id}`
            ) // Asegurar que sea el sucesor
        );

        return (
          <div className="flex items-center space-x-1">
            {/* Botón para Programar Siguiente Mantenimiento */}
            {/* Se muestra si el mantenimiento actual está FINALIZADO y no hay un sucesor pendiente */}
            {maintenance.state === "FINALIZADO" && !hasPendingSuccessor && (
              <Button
                variant="default"
                size="sm"
                onClick={() => handleScheduleNext(maintenance)}
                title="Programar Siguiente Mantenimiento"
                disabled={isScheduling}
              >
                {isScheduling ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Programando...
                  </>
                ) : (
                  <>
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            )}

            {/* Botón para Generar Tarea */}
            {/* Se muestra si el mantenimiento está PENDIENTE y NO tiene una tarea activa */}
            {maintenance.state === "PENDIENTE" && !hasActiveTask && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleGenerateTask(maintenance)}
                title="Generar Tarea de Mantenimiento"
                className="flex items-center gap-2"
              >
                <Wrench className="h-4 w-4" />
                <span>Generar Tarea</span>
              </Button>
            )}

            {/* Botón para Ver Tarea */}
            {/* Se muestra si el mantenimiento está PENDIENTE y SÍ tiene una tarea activa */}
            {maintenance.state === "PENDIENTE" &&
              hasActiveTask &&
              firstActiveTask?.id && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    router.push(
                      `/dashboard/tasks?openTask=${firstActiveTask.id}`
                    )
                  }
                  title="Ver tarea existente"
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  <span>Ver Tarea</span>
                </Button>
              )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => openModal(maintenance)}
              title="Editar"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setMaintenanceToDelete(maintenance);
                setIsDeleteConfirmOpen(true);
              }}
              title="Eliminar"
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        );
      },
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
    const { addNotification } = useNotification();
    const [isSaving, setIsSaving] = useState(false);
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
    const [formClients, setFormClients] = useState<Client[]>([]);
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

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!clientId) {
        addNotification("error", "Debes seleccionar un cliente.");
        return;
      }
      if (!lastMaintenanceDate || !nextMaintenanceDate) {
        addNotification("error", "Las fechas son obligatorias.");
        return;
      }

      setIsSaving(true);

      const maintenanceData: Maintenance = {
        clientId: parseInt(clientId),
        lastMaintenanceDate,
        nextMaintenanceDate,
        frequency,
        notes,
      };
      if (maintenance && maintenance.id) {
        maintenanceData.id = maintenance.id;
        maintenanceData.state = maintenance.state;
      }
      try {
        await onSave(maintenanceData);
      } catch (error) {
        console.error("Error en submit de formulario de mantención", error);
      } finally {
        setIsSaving(false);
      }
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
              Fecha de Inicio (o último mantenimiento)
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
          <Button
            variant="outline"
            type="button"
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar
          </Button>
        </div>
      </form>
    );
  };

  if (isLoading && !maintenances.length) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Mantenimientos</h1>
          <p className="text-content-subtle mt-1">
            Gestiona los ciclos de mantenimientos programados para tus clientes
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
            Gestiona los ciclos de mantenimientos programados para tus clientes
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
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        title="Eliminar Ciclo de Mantenimiento"
        description={`¿Estás seguro de eliminar el mantenimiento del cliente ${maintenanceToDelete?.client?.name} (ID: ${maintenanceToDelete?.id})? Esta acción no se puede deshacer.`}
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

      {isTaskFormOpen && maintenanceForTask && (
        <TaskForm
          isOpen={isTaskFormOpen}
          task={{
            title: `Mantenimiento para ${maintenanceForTask.client?.name}`,
            clientId: maintenanceForTask.clientId,
            client: allClients.find(
              (c) => c.id === maintenanceForTask.clientId.toString()
            ),
            types: ["MANTENCION"],
            state: "PENDIENTE",
            startDate: maintenanceForTask.startDate || new Date().toISOString(),
            categories: [],
          }}
          clients={allClients}
          workers={workers}
          onSave={(task) =>
            handleSaveTask({
              ...task,
              maintenanceId: maintenanceForTask.id,
            })
          }
          onClose={() => setIsTaskFormOpen(false)}
          isLoading={isLoadingWorkers || isLoadingClients}
          isLoadingClients={isLoadingClients}
          isLoadingWorkers={isLoadingWorkers}
        />
      )}
    </div>
  );
}
