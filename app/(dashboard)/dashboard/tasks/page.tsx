// app/(dashboard)/dashboard/tasks/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { useSession } from "next-auth/react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { getClients, Client } from "@/services/clients";
import { getUsers, User } from "@/services/users";
import {
  getTasksByDate,
  createTask,
  updateTask,
  deleteTask,
  finalizeTask,
  startTask,
  type Task,
  type TasksByDateParams,
  type FinalizeTaskData,
  type TaskFilterParams,
  getAllTasks as getFilteredTasks,
  downloadTasksExcel,
} from "@/services/tasks";
import {
  Loader2,
  Search,
  Filter as FilterIcon,
  Calendar as CalendarIconLucide,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  FileSpreadsheet,
} from "lucide-react";
import TaskList from "@/components/tasks/TaskList";
import TaskForm from "@/components/tasks/TaskForm";
import FinalizeTaskForm from "@/components/tasks/FinalizeTaskForm";
import TaskDetail from "@/components/tasks/TaskDetail";
import { useNotification } from "@/contexts/NotificationContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSearchParams } from "next/navigation";

const TASK_TYPES_OPTIONS = [
  "REVISION",
  "REPARACION",
  "MANTENCION",
  "INSTALACION",
].map((type) => ({
  value: type,
  label: type.charAt(0) + type.slice(1).toLowerCase(),
}));
const TASK_STATES_OPTIONS = [
  { value: "ALL", label: "Todos los estados" },
  { value: "PENDIENTE", label: "Pendiente" },
  { value: "EN_CURSO", label: "En Curso" },
  { value: "FINALIZADO", label: "Finalizado" },
];

export default function TasksPage() {
  const { data: session } = useSession();
  const { addNotification } = useNotification();
  const searchParams = useSearchParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSavingTask, setIsSavingTask] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isFinalizingTask, setIsFinalizingTask] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeletingTask, setIsDeletingTask] = useState(false);

  const [clients, setClients] = useState<Client[]>([]);
  const [workers, setWorkers] = useState<User[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [isLoadingWorkers, setIsLoadingWorkers] = useState(true);
  const [isStartingTask, setIsStartingTask] = useState(false);

  const [searchFilters, setSearchFilters] = useState<TaskFilterParams>({
    clientId: undefined,
    taskType: undefined,
    startDate: undefined,
    endDate: undefined,
    state: "ALL",
  });
  const [searchTerm, setSearchTerm] = useState("");

  const isAdmin = () => session?.user?.role === "ADMIN";

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoadingData(true);
      setIsLoadingClients(true);
      setIsLoadingWorkers(true);
      try {
        const clientsData = await getClients();
        setClients(clientsData || []);
      } catch (err) {
        addNotification("error", "Error al cargar clientes");
        console.error("Error fetching clients:", err);
      } finally {
        setIsLoadingClients(false);
      }

      try {
        const workersData = await getUsers();
        const processedWorkers = (workersData || []).map((worker) => ({
          ...worker,
          name: worker.name || worker.email || `Técnico ${worker.id}`,
          role: worker.role || "WORKER",
          email: worker.email || "",
        }));
        setWorkers(processedWorkers);
      } catch (err) {
        addNotification("error", "Error al cargar técnicos");
        console.error("Error fetching workers:", err);
      } finally {
        setIsLoadingWorkers(false);
      }
      setIsLoadingData(false);
    };
    loadInitialData();
  }, [addNotification]);

  useEffect(() => {
    fetchTasks();
  }, [searchFilters]);

  const fetchTasks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const tasksData = await getFilteredTasks(searchFilters);
      setTasks(tasksData || []);
      const openTaskId = searchParams.get("openTask");
      if (openTaskId) {
        const taskToView = tasksData.find((t) => t.id === parseInt(openTaskId));
        if (taskToView) {
          setViewingTask(taskToView);
        }
      }
    } catch (err) {
      console.error("Error al cargar tareas:", err);
      setError("Error al cargar las tareas. Intente nuevamente.");
      setTasks([]);
      addNotification("error", "Error al cargar tareas");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchFilterChange = (
    filterName: keyof TaskFilterParams,
    value: string | undefined
  ) => {
    setSearchFilters((prev) => ({
      ...prev,
      [filterName]: value === "ALL" || value === "" ? undefined : value,
    }));
  };

  const handleDateRangeChange = (range: { start?: Date; end?: Date }) => {
    setSearchFilters((prev) => ({
      ...prev,
      startDate: range.start?.toISOString().split("T")[0],
      endDate: range.end?.toISOString().split("T")[0],
    }));
  };

  const filteredTasksBySearchTerm = useMemo(() => {
    if (!searchTerm) return tasks;
    return tasks.filter(
      (task) =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.description &&
          task.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (task.client &&
          task.client.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [tasks, searchTerm]);
  const handleAddTask = () => {
    setCurrentTask(null);
    setIsEditing(true);
  };

  const handleEditTask = (task: Task) => {
    setCurrentTask(task);
    setIsEditing(true);
  };

  const handleViewTask = (task: Task) => {
    setViewingTask(task);
  };

  const handleFinalizeTask = (task: Task) => {
    setCurrentTask(task);
    setIsFinalizing(true);
  };

  const handleStartTask = async (task: Task) => {
    setIsStartingTask(true);
    try {
      const result = await startTask(task.id!);
      if (result && result.task) {
        setTasks((prevTasks) =>
          prevTasks.map((t) => (t.id === task.id ? result.task : t))
        );
        addNotification("success", "Tarea iniciada correctamente");
      }
    } catch (error) {
      addNotification("error", "Error al iniciar la tarea");
    } finally {
      setIsStartingTask(false);
    }
  };

  const handleDeleteConfirm = (task: Task) => {
    setTaskToDelete(task);
    setIsDeleteConfirmOpen(true);
  };

  const handleSaveTask = async (taskData: Task) => {
    setIsSavingTask(true);
    try {
      if (currentTask && currentTask.id) {
        const updated = await updateTask(currentTask.id.toString(), taskData);
        setTasks(
          tasks.map((t) => (t.id === currentTask.id ? updated.task : t))
        );
        addNotification("success", "Tarea actualizada");
      } else {
        const created = await createTask(taskData);
        setTasks([...tasks, created.task]);
        addNotification("success", "Tarea creada");
      }
      setIsEditing(false);
      setCurrentTask(null);
    } catch (err) {
      addNotification("error", "Error al guardar tarea");
    } finally {
      setIsSavingTask(false);
    }
  };

  const handleFinalizeSubmit = async (data: FinalizeTaskData) => {
    setIsFinalizingTask(true);
    try {
      const result = await finalizeTask(data);
      setTasks(tasks.map((t) => (t.id === data.taskId ? result.task : t)));
      setIsFinalizing(false);
      setCurrentTask(null);
      addNotification("success", "Tarea finalizada");
    } catch (err) {
      addNotification("error", "Error al finalizar tarea");
    } finally {
      setIsFinalizingTask(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete || !taskToDelete.id) return;
    setIsDeletingTask(true);
    try {
      await deleteTask(taskToDelete.id.toString());
      setTasks(tasks.filter((task) => task.id !== taskToDelete.id));
      addNotification("success", "Tarea eliminada");
    } catch (err) {
      addNotification("error", "Error al eliminar tarea");
    } finally {
      setIsDeletingTask(false);
      setIsDeleteConfirmOpen(false);
      setTaskToDelete(null);
    }
  };

  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    try {
      const blob = await downloadTasksExcel(searchFilters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Reporte_Tareas_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      addNotification("success", "Tareas exportadas a Excel correctamente");
    } catch (error) {
      console.error("Error al exportar tareas a Excel:", error);
      addNotification("error", "No se pudo exportar las tareas a Excel");
    } finally {
      setIsExportingExcel(false);
    }
  };

  if (isLoadingData && !tasks.length) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Tareas</h1>
          <p className="text-content-subtle mt-1">
            Gestiona las tareas y trabajos del equipo técnico
          </p>
        </div>
        <div className="h-[500px] w-full flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
          <p>Cargando datos necesarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Tareas</h1>
        <p className="text-content-subtle mt-1">
          Gestiona las tareas y trabajos del equipo técnico
        </p>
      </div>
      {viewingTask ? (
        <>
          <TaskDetail
            task={viewingTask}
            isAdmin={isAdmin()}
            onEdit={handleEditTask}
            onDelete={handleDeleteConfirm}
            onFinalize={handleFinalizeTask}
            onStart={handleStartTask}
          />
          <div className="flex justify-center mt-4">
            <Button
              variant="outline"
              onClick={() => setViewingTask(null)}
              className="w-full max-w-md"
            >
              Volver a la lista de tareas
            </Button>
          </div>
        </>
      ) : (
        <Card className="p-6">
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="space-y-1">
              <label htmlFor="clientFilter" className="text-sm font-medium">
                Cliente
              </label>
              <Select
                value={searchFilters.clientId || ""}
                onValueChange={(value) =>
                  handleSearchFilterChange(
                    "clientId",
                    value === "ALL" ? undefined : value
                  )
                }
                disabled={isLoadingClients || isLoading}
              >
                <SelectTrigger id="clientFilter">
                  {isLoadingClients ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <SelectValue placeholder="Todos los clientes" />
                  )}
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto">
                  <SelectItem value="ALL">Todos los clientes</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id!.toString()}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label htmlFor="taskTypeFilter" className="text-sm font-medium">
                Tipo de Tarea
              </label>
              <Select
                value={searchFilters.taskType || ""}
                onValueChange={(value) =>
                  handleSearchFilterChange(
                    "taskType",
                    value === "ALL" ? undefined : value
                  )
                }
                disabled={isLoading}
              >
                <SelectTrigger id="taskTypeFilter">
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos los tipos</SelectItem>
                  {TASK_TYPES_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 md:col-span-2 lg:col-span-1">
              <label className="text-sm font-medium">Rango de Fechas</label>
              <DateRangePicker
                value={{
                  start: searchFilters.startDate
                    ? new Date(searchFilters.startDate + "T00:00:00Z")
                    : undefined,
                  end: searchFilters.endDate
                    ? new Date(searchFilters.endDate + "T23:59:59Z")
                    : undefined,
                }}
                onChange={(range) => handleDateRangeChange(range)}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="stateFilter" className="text-sm font-medium">
                Estado
              </label>
              <Select
                value={searchFilters.state || "ALL"}
                onValueChange={(value) =>
                  handleSearchFilterChange("state", value)
                }
                disabled={isLoading}
              >
                <SelectTrigger id="stateFilter">
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  {TASK_STATES_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="relative md:col-span-2 lg:col-span-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por título, descripción o cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div>
              {isAdmin() && (
                <Button
                  onClick={handleExportExcel}
                  variant="outline"
                  disabled={isExportingExcel || isLoading || tasks.length === 0}
                >
                  {isExportingExcel ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                  )}
                  Exportar a Excel
                </Button>
              )}
            </div>
            <div className="flex justify-end w-full md:w-auto">
              {isAdmin() && (
                <Button
                  onClick={handleAddTask}
                  disabled={isLoadingData || isLoading}
                >
                  <Plus className="mr-2 h-4 w-4" /> Nueva Tarea
                </Button>
              )}
            </div>
          </div>
          <TaskList
            tasks={filteredTasksBySearchTerm}
            isLoading={isLoading}
            isAdmin={isAdmin()}
            onEdit={handleEditTask}
            onView={handleViewTask}
            onDelete={handleDeleteConfirm}
            onFinalize={handleFinalizeTask}
          />
        </Card>
      )}
      {error && (
        <div className="text-center p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          {error}
          <button className="ml-2 underline" onClick={fetchTasks}>
            Reintentar
          </button>
        </div>
      )}
      <TaskForm
        isOpen={isEditing}
        task={currentTask}
        clients={clients}
        workers={workers}
        onSave={handleSaveTask}
        onClose={() => setIsEditing(false)}
        isLoading={isSavingTask}
        isLoadingClients={isLoadingClients}
        isLoadingWorkers={isLoadingWorkers}
      />
      <FinalizeTaskForm
        isOpen={isFinalizing}
        task={currentTask}
        onSave={handleFinalizeSubmit}
        onClose={() => setIsFinalizing(false)}
        isLoading={isFinalizingTask}
      />
      <ConfirmDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        title="Eliminar Tarea"
        description={`¿Estás seguro que deseas eliminar la tarea "${
          taskToDelete?.title || "seleccionada"
        }"? Esta acción no se puede deshacer.`}
        onConfirm={handleDeleteTask}
        confirmLabel="Eliminar"
        isLoading={isDeletingTask}
      />
    </div>
  );
}
