import { useState, useEffect } from "react";
import { FormField, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormTextarea } from "@/components/ui/form-textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Task } from "@/services/tasks";
import { Client } from "@/services/clients";
import { User } from "@/services/users";
import { Quotation, getQuotationsByClient } from "@/services/quotations";
import ClientSelect from "@/components/clients/ClientSelect";
import UserSelect from "@/components/tasks/UserSelect";
import { useNotification } from "@/contexts/NotificationContext";

interface TaskFormProps {
  isOpen: boolean;
  task: Task | null;
  clients: Client[];
  workers: User[];
  onSave: (task: Task) => Promise<void>;
  onClose: () => void;
  onUserCreated?: (user: User) => void;
  onClientCreated?: (client: Client) => void;
}

// Constantes para tipos y estados de tareas
const TASK_STATES = ["PENDIENTE", "EN_CURSO", "FINALIZADO"];
const TASK_TYPES = ["REVISION", "REPARACION", "MANTENCION"];
const TASK_CATEGORIES = [
  "CCTV",
  "Citofonia",
  "Cerco eléctrico",
  "Alarma",
  "Control de acceso",
  "Redes",
  "Otros",
];

export default function TaskForm({
  isOpen,
  task,
  clients,
  workers,
  onSave,
  onClose,
  onUserCreated,
  onClientCreated,
}: TaskFormProps) {
  const { addNotification } = useNotification();
  const [taskForm, setTaskForm] = useState<Task>({
    title: "",
    description: "",
    state: "PENDIENTE",
    types: [],
    categories: [],
    startDate: new Date().toISOString().split("T")[0],
  });
  const [clientQuotations, setClientQuotations] = useState<Quotation[]>([]);
  const [isLoadingQuotations, setIsLoadingQuotations] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>("");

  // Para depuración
  useEffect(() => {
    console.log("Workers disponibles en TaskForm:", workers);
    console.log("Task actual:", task);
  }, [workers, task]);

  useEffect(() => {
    if (task) {
      // Asegurar que los arrays estén definidos
      setTaskForm({
        ...task,
        types: task.types || [],
        categories: task.categories || [],
        startDate: new Date(task.startDate).toISOString().split("T")[0],
        endDate: task.endDate
          ? new Date(task.endDate).toISOString().split("T")[0]
          : undefined,
      });

      // Si la tarea tiene trabajadores asignados, seleccionar el primero
      if (task.assignedWorkers && task.assignedWorkers.length > 0) {
        setSelectedWorkerId(task.assignedWorkers[0].workerId.toString());
      }

      // Si la tarea tiene un cliente, cargar sus cotizaciones
      if (task.clientId) {
        loadClientQuotations(task.clientId);
      }
    } else {
      // Reset form for new task
      setTaskForm({
        title: "",
        description: "",
        state: "PENDIENTE",
        types: [],
        categories: [],
        startDate: new Date().toISOString().split("T")[0],
      });
      setSelectedWorkerId("");
      setClientQuotations([]);
    }
  }, [task, isOpen]);

  // Función para cargar cotizaciones del cliente seleccionado
  const loadClientQuotations = async (clientId: number) => {
    setIsLoadingQuotations(true);
    try {
      const quotations = await getQuotationsByClient(clientId);
      console.log("Cotizaciones del cliente:", quotations);
      setClientQuotations(quotations);
    } catch (error) {
      console.error("Error al cargar cotizaciones del cliente:", error);
      addNotification("error", "Error al cargar cotizaciones del cliente");
      setClientQuotations([]);
    } finally {
      setIsLoadingQuotations(false);
    }
  };

  const handleSave = async () => {
    // Validación básica
    if (!taskForm.title) {
      addNotification("error", "El título es obligatorio");
      return;
    }

    if (!taskForm.startDate) {
      addNotification("error", "La fecha de inicio es obligatoria");
      return;
    }

    // Preparar datos para enviar
    const taskData: Task = {
      ...taskForm,
      // Convertir explícitamente a undefined si es necesario
      quotationId: taskForm.quotationId || undefined,
      // Asegurar que se envíen arrays vacíos en lugar de undefined
      types: taskForm.types || [],
      categories: taskForm.categories || [],
      // Asignar el trabajador seleccionado si existe
      assignedWorkerIds: selectedWorkerId ? [parseInt(selectedWorkerId)] : [],
    };

    console.log("Datos de tarea a guardar:", taskData);
    await onSave(taskData);
  };

  const handleTypeToggle = (type: string) => {
    setTaskForm((prev) => {
      const types = prev.types || [];
      if (types.includes(type)) {
        return {
          ...prev,
          types: types.filter((t) => t !== type),
        };
      } else {
        return {
          ...prev,
          types: [...types, type],
        };
      }
    });
  };

  const handleCategoryToggle = (category: string) => {
    setTaskForm((prev) => {
      const categories = prev.categories || [];
      if (categories.includes(category)) {
        return {
          ...prev,
          categories: categories.filter((c) => c !== category),
        };
      } else {
        return {
          ...prev,
          categories: [...categories, category],
        };
      }
    });
  };

  const handleClientChange = (value: string, client?: Client) => {
    const clientId = value ? parseInt(value) : undefined;

    setTaskForm({
      ...taskForm,
      clientId: clientId,
      client: client,
      // Al cambiar de cliente, limpiar la cotización seleccionada
      quotationId: undefined,
      quotation: undefined,
    });

    // Si hay un cliente seleccionado, cargar sus cotizaciones
    if (clientId) {
      loadClientQuotations(clientId);
    } else {
      // Si no hay cliente, limpiar las cotizaciones
      setClientQuotations([]);
    }
  };

  const handleQuotationChange = (value: string) => {
    if (!value || value === "-") {
      // Si selecciona "Sin cotización"
      setTaskForm({
        ...taskForm,
        quotationId: undefined,
        quotation: undefined,
      });
      return;
    }

    const quotationId = parseInt(value);
    const selectedQuotation = clientQuotations.find(
      (q) => q.id === quotationId
    );

    if (selectedQuotation) {
      setTaskForm({
        ...taskForm,
        quotationId: quotationId,
        quotation: {
          id: selectedQuotation.id,
          title: selectedQuotation.title,
          amount: selectedQuotation.amount || 0,
        },
      });
    }
  };

  const handleWorkerChange = (value: string, worker?: User) => {
    console.log("Worker seleccionado:", value, worker);
    setSelectedWorkerId(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{task ? "Editar Tarea" : "Nueva Tarea"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <FormField>
            <FormLabel>Título</FormLabel>
            <Input
              value={taskForm.title}
              onChange={(e) =>
                setTaskForm({ ...taskForm, title: e.target.value })
              }
              required
            />
          </FormField>

          <FormField>
            <FormLabel>Cliente</FormLabel>
            <ClientSelect
              clients={clients}
              value={taskForm.clientId?.toString() || ""}
              onValueChange={handleClientChange}
              onClientCreated={onClientCreated}
            />
          </FormField>

          {/* Selector de cotizaciones (solo aparece si hay un cliente seleccionado) */}
          {taskForm.clientId && (
            <FormField>
              <FormLabel>Cotización</FormLabel>
              <Select
                value={taskForm.quotationId?.toString() || "-"}
                onValueChange={handleQuotationChange}
                disabled={isLoadingQuotations || clientQuotations.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cotización" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="-">Sin cotización</SelectItem>
                  {isLoadingQuotations ? (
                    <SelectItem value="loading" disabled>
                      Cargando cotizaciones...
                    </SelectItem>
                  ) : clientQuotations.length > 0 ? (
                    clientQuotations.map((quotation) => (
                      <SelectItem
                        key={quotation.id}
                        value={quotation.id.toString()}
                      >
                        {quotation.title} - $
                        {quotation.amount?.toLocaleString()}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="empty" disabled>
                      No hay cotizaciones para este cliente
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </FormField>
          )}

          <FormField className="md:col-span-2">
            <FormLabel>Descripción</FormLabel>
            <FormTextarea
              value={taskForm.description || ""}
              onChange={(e) =>
                setTaskForm({ ...taskForm, description: e.target.value })
              }
            />
          </FormField>

          <FormField>
            <FormLabel>Estado</FormLabel>
            <Select
              value={taskForm.state}
              onValueChange={(value) =>
                setTaskForm({ ...taskForm, state: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TASK_STATES.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state === "PENDIENTE"
                      ? "Pendiente"
                      : state === "EN_CURSO"
                      ? "En curso"
                      : "Finalizado"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <div className="space-y-2">
            <FormLabel>Fecha de inicio</FormLabel>
            <Input
              type="date"
              value={taskForm.startDate}
              onChange={(e) =>
                setTaskForm({ ...taskForm, startDate: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <FormLabel>Fecha de fin (opcional)</FormLabel>
            <Input
              type="date"
              value={taskForm.endDate || ""}
              onChange={(e) =>
                setTaskForm({
                  ...taskForm,
                  endDate: e.target.value || undefined,
                })
              }
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <FormLabel>Tipo de servicio</FormLabel>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {TASK_TYPES.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`type-${type}`}
                    checked={(taskForm.types || []).includes(type)}
                    onCheckedChange={() => handleTypeToggle(type)}
                  />
                  <label
                    htmlFor={`type-${type}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {type}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 space-y-2">
            <FormLabel>Categorías</FormLabel>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {TASK_CATEGORIES.map((category) => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category}`}
                    checked={(taskForm.categories || []).includes(category)}
                    onCheckedChange={() => handleCategoryToggle(category)}
                  />
                  <label
                    htmlFor={`category-${category}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {category}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <FormLabel>Técnicos asignados</FormLabel>
            <UserSelect
              workers={workers}
              value={selectedWorkerId}
              onValueChange={handleWorkerChange}
              onUserCreated={onUserCreated}
            />
          </div>
        </div>

        {/* Mostrar información de la cotización seleccionada si existe */}
        {taskForm.quotationId && taskForm.quotation && (
          <div className="border border-border rounded-md p-3 mb-4 bg-muted/30">
            <h4 className="font-medium mb-2">Información de la cotización</h4>
            <p className="text-sm">
              <span className="font-medium">Título:</span>{" "}
              {taskForm.quotation.title}
            </p>
            <p className="text-sm">
              <span className="font-medium">Monto total:</span> $
              {taskForm.quotation.amount.toLocaleString()}
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
