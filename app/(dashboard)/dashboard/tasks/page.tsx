"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { useSession } from "next-auth/react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { getClients } from "@/services/clients";
import { getUsers, User } from "@/services/users";
import {
  getAllTasks,
  getTasksByDate,
  createTask,
  updateTask,
  deleteTask,
  finalizeTask,
  type Task,
  type TasksByDateParams,
  type FinalizeTaskData,
} from "@/services/tasks";
import { Loader2 } from "lucide-react";

// Componentes refactorizados con loaders
import TaskFilters from "@/components/tasks/TaskFilters";
import TaskList from "@/components/tasks/TaskList";
import TaskForm from "@/components/tasks/TaskForm";
import FinalizeTaskForm from "@/components/tasks/FinalizeTaskForm";
import { useNotification } from "@/contexts/NotificationContext";

// Interfaces
interface TasksFilterOptions {
  view: "daily" | "weekly" | "monthly";
  date: string;
  state?: string;
}

export default function TasksPage() {
  const { data: session } = useSession();
  const { addNotification } = useNotification();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingFilters, setIsLoadingFilters] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSavingTask, setIsSavingTask] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isFinalizingTask, setIsFinalizingTask] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<TasksFilterOptions>({
    view: "weekly",
    date: new Date().toISOString().split("T")[0],
  });
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeletingTask, setIsDeletingTask] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [workers, setWorkers] = useState<User[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [isLoadingWorkers, setIsLoadingWorkers] = useState(true);

  // Verificar si el usuario tiene el rol ADMIN
  const isAdmin = () => {
    return session?.user?.role === "ADMIN";
  };

  // Cargar tareas al cambiar los filtros
  useEffect(() => {
    fetchTasks();
  }, [filters]);

  // Cargar clientes y usuarios (trabajadores) al montar
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingData(true);
      setIsLoadingClients(true);
      setIsLoadingWorkers(true);
      try {
        // Cargar clientes
        try {
          const clientsData = await getClients();
          if (!clientsData || !Array.isArray(clientsData)) {
            console.error("Datos de clientes inválidos:", clientsData);
            addNotification("error", "Error al cargar los datos de clientes");
          } else {
            console.log("Clientes cargados:", clientsData);
            setClients(clientsData);
          }
        } catch (error) {
          console.error("Error al cargar clientes:", error);
          addNotification("error", "Error al cargar los clientes");
        } finally {
          setIsLoadingClients(false);
        }

        // Cargar trabajadores
        try {
          const workersData = await getUsers();
          if (!workersData || !Array.isArray(workersData)) {
            console.error("Datos de trabajadores inválidos:", workersData);
            addNotification("error", "Error al cargar los trabajadores");
            setWorkers([]);
          } else {
            console.log("Usuarios recibidos del API:", workersData);

            // Procesar los datos de trabajadores para asegurar que tengan todos los campos necesarios
            const processedWorkers = workersData.map((worker) => ({
              ...worker,
              // Asegurar que exista un nombre (usar email si no hay nombre)
              name: worker.name || worker.email || `Técnico ${worker.id}`,
              // Asegurar que tenga un rol (asumir WORKER si no es ADMIN explícitamente)
              role: worker.role === "ADMIN" ? "ADMIN" : "WORKER",
              // Asegurar que tenga un email
              email: worker.email || "",
            }));

            setWorkers(processedWorkers);
          }
        } catch (error) {
          console.error("Error al cargar trabajadores:", error);
          addNotification("error", "Error al cargar los trabajadores");
        } finally {
          setIsLoadingWorkers(false);
        }
      } catch (err) {
        console.error("Error al cargar datos:", err);
        setError("Error al cargar datos necesarios");
        addNotification("error", "Error al cargar los datos");
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, []);

  // Función para cargar tareas según filtros
  const fetchTasks = async () => {
    setIsLoading(true);
    setIsLoadingFilters(true);
    try {
      let tasksData;
      if (filters.view) {
        const params: TasksByDateParams = {
          date: filters.date,
          view: filters.view,
        };
        tasksData = await getTasksByDate(params);

        if (tasksData && tasksData.tasks) {
          setTasks(tasksData.tasks);
        } else {
          console.error("Formato de datos inválido:", tasksData);
          setTasks([]);
        }
      } else {
        tasksData = await getAllTasks();
        if (Array.isArray(tasksData)) {
          setTasks(tasksData);
        } else {
          console.error("Formato de datos inválido:", tasksData);
          setTasks([]);
        }
      }
      setError(null);
    } catch (err) {
      console.error("Error al cargar tareas:", err);
      setError("Error al cargar las tareas. Intente nuevamente.");
      setTasks([]);
    } finally {
      // Agregamos un pequeño retraso para mostrar el loader
      setTimeout(() => {
        setIsLoading(false);
        setIsLoadingFilters(false);
      }, 500);
    }
  };

  // Filtrar tareas por estado o término de búsqueda
  const filteredTasks = tasks.filter((task) => {
    // Filtrar por término de búsqueda (con validación)
    const matchesSearch =
      (task.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (task.client && task.client.name
        ? task.client.name.toLowerCase().includes(searchTerm.toLowerCase())
        : false);

    // Filtrar por estado
    const matchesState = !filters.state || task.state === filters.state;

    return matchesSearch && matchesState;
  });

  // Función para agregar un nuevo trabajador a la lista local
  const handleUserCreated = (newUser: User) => {
    console.log("Nuevo usuario creado:", newUser);
    setWorkers((prevWorkers) => [...prevWorkers, newUser]);
  };

  // Función para agregar un nuevo cliente a la lista local
  const handleClientCreated = (newClient: any) => {
    console.log("Nuevo cliente creado:", newClient);
    setClients((prevClients) => [...prevClients, newClient]);
  };

  // Handlers
  const handleAddTask = () => {
    setCurrentTask(null);
    setIsEditing(true);
  };

  const handleEditTask = (task: Task) => {
    setCurrentTask(task);
    setIsEditing(true);
  };

  const handleFinalizeTask = (task: Task) => {
    setCurrentTask(task);
    setIsFinalizing(true);
  };

  const handleDeleteConfirm = (task: Task) => {
    setTaskToDelete(task);
    setIsDeleteConfirmOpen(true);
  };

  const handleFilterChange = (newFilters: TasksFilterOptions) => {
    setFilters(newFilters);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleSaveTask = async (taskData: Task) => {
    try {
      setIsSavingTask(true);
      if (currentTask && currentTask.id) {
        // Actualizar tarea existente
        const updatedTask = await updateTask(
          currentTask.id.toString(),
          taskData
        );

        if (updatedTask && updatedTask.task) {
          setTasks((tasks) =>
            tasks.map((t) => (t.id === currentTask.id ? updatedTask.task : t))
          );
          addNotification("success", "Tarea actualizada correctamente");
        } else {
          throw new Error(
            "La respuesta del servidor no incluyó la tarea actualizada"
          );
        }
      } else {
        // Crear nueva tarea
        const newTask = await createTask(taskData);

        if (newTask && newTask.task) {
          setTasks((tasks) => [...tasks, newTask.task]);
          addNotification("success", "Tarea creada correctamente");
        } else {
          throw new Error(
            "La respuesta del servidor no incluyó la nueva tarea"
          );
        }
      }
      setIsEditing(false);
      setCurrentTask(null);
      setError(null);
    } catch (err) {
      console.error("Error al guardar la tarea:", err);
      setError("Error al guardar la tarea");
      addNotification("error", "Error al guardar la tarea");
    } finally {
      setIsSavingTask(false);
    }
  };

  const handleFinalizeSubmit = async (data: FinalizeTaskData) => {
    try {
      setIsFinalizingTask(true);
      const result = await finalizeTask(data);

      if (result && result.task) {
        setTasks((tasks) =>
          tasks.map((t) => (t.id === data.taskId ? result.task : t))
        );
        setIsFinalizing(false);
        setCurrentTask(null);
        setError(null);
        addNotification("success", "Tarea finalizada correctamente");
      } else {
        throw new Error(
          "La respuesta del servidor no incluyó la tarea finalizada"
        );
      }
    } catch (err) {
      console.error("Error al finalizar la tarea:", err);
      setError("Error al finalizar la tarea");
      addNotification("error", "Error al finalizar la tarea");
    } finally {
      setIsFinalizingTask(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete || !taskToDelete.id) return;

    try {
      setIsDeletingTask(true);
      await deleteTask(taskToDelete.id.toString());
      setTasks((tasks) => tasks.filter((task) => task.id !== taskToDelete.id));
      setError(null);
      addNotification("success", "Tarea eliminada correctamente");
    } catch (err) {
      console.error("Error al eliminar la tarea:", err);
      setError("Error al eliminar la tarea");
      addNotification("error", "Error al eliminar la tarea");
    } finally {
      setIsDeletingTask(false);
      setIsDeleteConfirmOpen(false);
      setTaskToDelete(null);
    }
  };

  // Mostrar pantalla de carga mientras se obtienen los datos iniciales
  if (isLoadingData) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-content-emphasis">Tareas</h1>
          <p className="text-content-subtle mt-2">
            Gestiona las tareas y trabajos del equipo técnico
          </p>
        </div>
        <div className="h-[500px] w-full flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
          <p>Cargando datos necesarios...</p>
          <div className="mt-4 flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  isLoadingClients
                    ? "bg-yellow-400 animate-pulse"
                    : "bg-green-500"
                }`}
              ></div>
              <span className="text-sm">Clientes</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  isLoadingWorkers
                    ? "bg-yellow-400 animate-pulse"
                    : "bg-green-500"
                }`}
              ></div>
              <span className="text-sm">Técnicos</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-content-emphasis">Tareas</h1>
        <p className="text-content-subtle mt-2">
          Gestiona las tareas y trabajos del equipo técnico
        </p>
      </div>

      <Card className="p-6">
        <TaskFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          onAddTask={handleAddTask}
          isAdmin={isAdmin()}
          isLoading={isLoadingFilters}
        />

        <TaskList
          tasks={filteredTasks}
          isLoading={isLoading}
          isAdmin={isAdmin()}
          onEdit={handleEditTask}
          onDelete={handleDeleteConfirm}
          onFinalize={handleFinalizeTask}
        />
      </Card>

      {error && (
        <div className="text-center p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          {error}
          <button className="ml-2 underline" onClick={() => fetchTasks()}>
            Reintentar
          </button>
        </div>
      )}

      {/* Formulario para crear/editar tarea */}
      <TaskForm
        isOpen={isEditing}
        task={currentTask}
        clients={clients}
        workers={workers}
        onSave={handleSaveTask}
        onClose={() => setIsEditing(false)}
        onUserCreated={handleUserCreated}
        onClientCreated={handleClientCreated}
        isLoading={isSavingTask}
        isLoadingClients={isLoadingClients}
        isLoadingWorkers={isLoadingWorkers}
      />

      {/* Formulario para finalizar tarea */}
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
