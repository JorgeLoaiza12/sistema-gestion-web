"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable, type ColumnDef } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormField, FormLabel } from "@/components/ui/form";
import {
  Plus,
  Edit,
  Trash,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormTextarea } from "@/components/ui/form-textarea";
import { getClients } from "@/services/clients";
import {
  getAllTasks,
  getTasksByDate,
  createTask,
  updateTask,
  deleteTask,
  finalizeTask,
} from "@/services/tasks";
import { useSession } from "next-auth/react";

// Interfaces para manejar los datos de las tareas
interface Worker {
  id: number;
  name: string;
  email: string;
}

interface Client {
  id: number;
  name: string;
  email: string;
  phone?: string;
}

interface Quotation {
  id: number;
  title: string;
  amount: number;
}

interface TaskAssignment {
  workerId: number;
  worker: Worker;
}

interface Task {
  id?: number;
  title: string;
  description?: string;
  quotationId?: number;
  clientId?: number;
  state: string;
  types: string[];
  categories: string[];
  technicalReport?: string;
  observations?: string;
  hoursWorked?: number;
  mediaUrls?: string[];
  startDate: string;
  endDate?: string;
  client?: Client;
  quotation?: Quotation;
  assignedWorkers?: TaskAssignment[];
}

interface TasksFilterOptions {
  view: "daily" | "weekly" | "monthly";
  date: string;
  state?: string;
}

export default function TasksPage() {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<TasksFilterOptions>({
    view: "weekly",
    date: new Date().toISOString().split("T")[0],
  });
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeletingTask, setIsDeletingTask] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([
    { id: 1, name: "Técnico 1", email: "tecnico1@example.com" },
    { id: 2, name: "Técnico 2", email: "tecnico2@example.com" },
    { id: 3, name: "Técnico 3", email: "tecnico3@example.com" },
  ]);

  // Estados para formulario de tarea
  const [taskForm, setTaskForm] = useState<Task>({
    title: "",
    description: "",
    state: "PENDIENTE",
    types: [],
    categories: [],
    startDate: new Date().toISOString().split("T")[0],
  });

  // Estados para formulario de finalización
  const [finalizeForm, setFinalizeForm] = useState({
    taskId: 0,
    technicalReport: "",
    observations: "",
    hoursWorked: 1,
    mediaUrls: [],
    endDate: new Date().toISOString().split("T")[0],
  });

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

  // Verificar si el usuario tiene el rol ADMIN
  const isAdmin = () => {
    return session?.user?.role === "ADMIN";
  };

  // Cargar tareas al cambiar los filtros
  useEffect(() => {
    fetchTasks();
  }, [filters]);

  // Cargar clientes al montar
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const clientsData = await getClients();
        setClients(clientsData);
      } catch (err) {
        console.error("Error al cargar clientes:", err);
      }
    };

    fetchClients();
  }, []);

  // Función para cargar tareas según filtros
  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      let tasksData;
      if (filters.view) {
        tasksData = await getTasksByDate({
          date: filters.date,
          view: filters.view,
        });
        setTasks(tasksData.tasks);
      } else {
        tasksData = await getAllTasks();
        setTasks(tasksData);
      }
      setError(null);
    } catch (err) {
      console.error("Error al cargar tareas:", err);
      setError("Error al cargar las tareas. Intente nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  // Funciones para manejo de formularios
  const handleAddTask = () => {
    setTaskForm({
      title: "",
      description: "",
      state: "PENDIENTE",
      types: [],
      categories: [],
      startDate: new Date().toISOString().split("T")[0],
    });
    setIsEditing(true);
    setCurrentTask(null);
  };

  const handleEditTask = (task: Task) => {
    setTaskForm({
      ...task,
      startDate: new Date(task.startDate).toISOString().split("T")[0],
      endDate: task.endDate
        ? new Date(task.endDate).toISOString().split("T")[0]
        : undefined,
    });
    setIsEditing(true);
    setCurrentTask(task);
  };

  const handleFinalizeTask = (task: Task) => {
    if (!task.id) return;
    setFinalizeForm({
      taskId: task.id,
      technicalReport: "",
      observations: "",
      hoursWorked: 1,
      mediaUrls: [],
      endDate: new Date().toISOString().split("T")[0],
    });
    setIsFinalizing(true);
    setCurrentTask(task);
  };

  const openDeleteConfirm = (task: Task) => {
    setTaskToDelete(task);
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete || !taskToDelete.id) return;

    try {
      setIsDeletingTask(true);
      await deleteTask(taskToDelete.id.toString());
      setTasks(tasks.filter((task) => task.id !== taskToDelete.id));
      setError(null);
    } catch (err) {
      console.error("Error al eliminar la tarea:", err);
      setError("Error al eliminar la tarea");
    } finally {
      setIsDeletingTask(false);
      setIsDeleteConfirmOpen(false);
    }
  };

  const handleSaveTask = async () => {
    try {
      if (currentTask && currentTask.id) {
        // Actualizar tarea existente
        const updatedTask = await updateTask(
          currentTask.id.toString(),
          taskForm
        );
        setTasks(
          tasks.map((t) => (t.id === currentTask.id ? updatedTask.task : t))
        );
      } else {
        // Crear nueva tarea
        const newTask = await createTask(taskForm);
        setTasks([...tasks, newTask.task]);
      }
      setIsEditing(false);
      setError(null);
    } catch (err) {
      console.error("Error al guardar la tarea:", err);
      setError("Error al guardar la tarea");
    }
  };

  const handleSubmitFinalize = async () => {
    try {
      const result = await finalizeTask(finalizeForm);
      setTasks(
        tasks.map((t) => (t.id === finalizeForm.taskId ? result.task : t))
      );
      setIsFinalizing(false);
      setError(null);
    } catch (err) {
      console.error("Error al finalizar la tarea:", err);
      setError("Error al finalizar la tarea");
    }
  };

  // Filtrar tareas por estado o término de búsqueda
  const filteredTasks = tasks.filter((task) => {
    // Filtrar por término de búsqueda
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description &&
        task.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (task.client &&
        task.client.name.toLowerCase().includes(searchTerm.toLowerCase()));

    // Filtrar por estado
    const matchesState = !filters.state || task.state === filters.state;

    return matchesSearch && matchesState;
  });

  // Obtener estado formateado para mostrar
  const getStateDisplay = (state: string) => {
    switch (state) {
      case "PENDIENTE":
        return (
          <div className="flex items-center gap-2 text-yellow-600">
            <AlertTriangle className="h-4 w-4" />
            <span>Pendiente</span>
          </div>
        );
      case "EN_CURSO":
        return (
          <div className="flex items-center gap-2 text-blue-600">
            <Clock className="h-4 w-4" />
            <span>En curso</span>
          </div>
        );
      case "FINALIZADO":
        return (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>Finalizado</span>
          </div>
        );
      default:
        return state;
    }
  };

  // Columnas para la tabla de tareas
  const columns: ColumnDef<Task>[] = [
    {
      accessorKey: "title",
      header: "Título",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.title}</p>
          {row.original.description && (
            <p className="text-sm text-content-subtle truncate max-w-xs">
              {row.original.description}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: "client",
      header: "Cliente",
      cell: ({ row }) =>
        row.original.client ? (
          <div>
            <p>{row.original.client.name}</p>
            <p className="text-sm text-content-subtle">
              {row.original.client.phone}
            </p>
          </div>
        ) : (
          <span className="text-content-subtle">-</span>
        ),
    },
    {
      accessorKey: "state",
      header: "Estado",
      cell: ({ row }) => getStateDisplay(row.original.state),
    },
    {
      accessorKey: "types",
      header: "Tipo",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.types.map((type) => (
            <span
              key={type}
              className="px-2 py-1 text-xs bg-accent text-primary rounded-full"
            >
              {type}
            </span>
          ))}
        </div>
      ),
    },
    {
      accessorKey: "startDate",
      header: "Fecha",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-content-subtle" />
          <span>{new Date(row.original.startDate).toLocaleDateString()}</span>
        </div>
      ),
    },
    {
      accessorKey: "assignedWorkers",
      header: "Técnicos",
      cell: ({ row }) => (
        <div>
          {row.original.assignedWorkers &&
          row.original.assignedWorkers.length > 0 ? (
            <div className="flex flex-col gap-1">
              {row.original.assignedWorkers.map((assignment) => (
                <span key={assignment.workerId}>{assignment.worker.name}</span>
              ))}
            </div>
          ) : (
            <span className="text-content-subtle">Sin asignar</span>
          )}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          {isAdmin() && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditTask(row.original)}
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
            </>
          )}
          {row.original.state !== "FINALIZADO" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFinalizeTask(row.original)}
            >
              <CheckCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-content-emphasis">Tareas</h1>
        <p className="text-content-subtle mt-2">
          Gestiona las tareas y trabajos del equipo técnico
        </p>
      </div>

      <Card className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h2 className="text-xl font-semibold">Lista de Tareas</h2>
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <div className="flex gap-2">
              <Select
                value={filters.view}
                onValueChange={(value: "daily" | "weekly" | "monthly") =>
                  setFilters({ ...filters, view: value })
                }
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Vista" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diaria</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensual</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="date"
                value={filters.date}
                onChange={(e) =>
                  setFilters({ ...filters, date: e.target.value })
                }
                className="w-[150px]"
              />

              <Select
                value={filters.state || ""}
                onValueChange={(value) =>
                  setFilters({ ...filters, state: value || undefined })
                }
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">Todos</SelectItem>
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
            </div>

            <Input
              placeholder="Buscar tareas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="md:w-60"
            />

            {isAdmin() && (
              <Button onClick={handleAddTask}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Tarea
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="text-center h-96 flex items-center justify-center">
            <p>Cargando tareas...</p>
          </div>
        ) : (
          <DataTable columns={columns} data={filteredTasks} />
        )}
      </Card>

      {error && <div className="text-center text-red-500">{error}</div>}

      {/* Formulario para crear/editar tarea */}
      {isEditing && (
        <Dialog
          open={isEditing}
          onOpenChange={(open) => {
            if (!open) setIsEditing(false);
          }}
        >
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>
                {currentTask ? "Editar Tarea" : "Nueva Tarea"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Select
                  value={taskForm.clientId?.toString() || ""}
                  onValueChange={(value) =>
                    setTaskForm({
                      ...taskForm,
                      clientId: value ? parseInt(value) : undefined,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="-">Sin cliente</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

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

              <FormField>
                <FormLabel>Tipos</FormLabel>
                <Select
                  value={taskForm.types[0] || ""}
                  onValueChange={(value) =>
                    setTaskForm({ ...taskForm, types: value ? [value] : [] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField>
                <FormLabel>Categoría</FormLabel>
                <Select
                  value={taskForm.categories[0] || ""}
                  onValueChange={(value) =>
                    setTaskForm({
                      ...taskForm,
                      categories: value ? [value] : [],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField>
                <FormLabel>Fecha de inicio</FormLabel>
                <Input
                  type="date"
                  value={taskForm.startDate}
                  onChange={(e) =>
                    setTaskForm({ ...taskForm, startDate: e.target.value })
                  }
                  required
                />
              </FormField>

              <FormField>
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
              </FormField>

              <FormField className="md:col-span-2">
                <FormLabel>Técnicos asignados</FormLabel>
                <Select
                  value={
                    taskForm.assignedWorkers && taskForm.assignedWorkers[0]
                      ? taskForm.assignedWorkers[0].workerId.toString()
                      : ""
                  }
                  onValueChange={(value) => {
                    const workerId = parseInt(value);
                    const worker = workers.find((w) => w.id === workerId);

                    setTaskForm({
                      ...taskForm,
                      assignedWorkers: value
                        ? [
                            {
                              workerId,
                              worker: worker!,
                            },
                          ]
                        : [],
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar técnico" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="-">Sin asignar</SelectItem>
                    {workers.map((worker) => (
                      <SelectItem key={worker.id} value={worker.id.toString()}>
                        {worker.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveTask}>Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Formulario para finalizar tarea */}
      {isFinalizing && (
        <Dialog
          open={isFinalizing}
          onOpenChange={(open) => {
            if (!open) setIsFinalizing(false);
          }}
        >
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Finalizar Tarea</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="font-medium">
                {currentTask ? currentTask.title : ""}
              </p>

              <FormField>
                <FormLabel>Informe técnico</FormLabel>
                <FormTextarea
                  value={finalizeForm.technicalReport}
                  onChange={(e) =>
                    setFinalizeForm({
                      ...finalizeForm,
                      technicalReport: e.target.value,
                    })
                  }
                  required
                />
              </FormField>

              <FormField>
                <FormLabel>Observaciones</FormLabel>
                <FormTextarea
                  value={finalizeForm.observations}
                  onChange={(e) =>
                    setFinalizeForm({
                      ...finalizeForm,
                      observations: e.target.value,
                    })
                  }
                />
              </FormField>

              <FormField>
                <FormLabel>Horas trabajadas</FormLabel>
                <Input
                  type="number"
                  value={finalizeForm.hoursWorked}
                  onChange={(e) =>
                    setFinalizeForm({
                      ...finalizeForm,
                      hoursWorked: parseFloat(e.target.value),
                    })
                  }
                  min="0.5"
                  step="0.5"
                  required
                />
              </FormField>

              <FormField>
                <FormLabel>Fecha de finalización</FormLabel>
                <Input
                  type="date"
                  value={finalizeForm.endDate}
                  onChange={(e) =>
                    setFinalizeForm({
                      ...finalizeForm,
                      endDate: e.target.value,
                    })
                  }
                  required
                />
              </FormField>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsFinalizing(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmitFinalize}>Finalizar Tarea</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <ConfirmDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        title="Eliminar Tarea"
        description={`¿Estás seguro que deseas eliminar la tarea "${taskToDelete?.title}"? Esta acción no se puede deshacer.`}
        onConfirm={handleDeleteTask}
        confirmLabel="Eliminar"
        isLoading={isDeletingTask}
      />
    </div>
  );
}
