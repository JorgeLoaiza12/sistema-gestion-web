import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable, type ColumnDef } from "@/components/ui/table";
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Edit,
  Trash,
  Loader2,
} from "lucide-react";
import { Task } from "@/services/tasks";

interface TaskListProps {
  tasks: Task[];
  isLoading: boolean;
  isAdmin: boolean;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onFinalize: (task: Task) => void;
}

export default function TaskList({
  tasks,
  isLoading,
  isAdmin,
  onEdit,
  onDelete,
  onFinalize,
}: TaskListProps) {
  const [loadingTaskAction, setLoadingTaskAction] = useState<{
    id: number | null;
    action: "edit" | "delete" | "finalize" | null;
  }>({ id: null, action: null });

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

  const handleActionStart = (
    taskId: number,
    action: "edit" | "delete" | "finalize"
  ) => {
    setLoadingTaskAction({ id: taskId, action });

    // Simular una pequeña demora antes de ejecutar la acción real
    // Esto es opcional, pero proporciona retroalimentación visual al usuario
    setTimeout(() => {
      switch (action) {
        case "edit":
          const taskToEdit = tasks.find((task) => task.id === taskId);
          if (taskToEdit) onEdit(taskToEdit);
          break;
        case "delete":
          const taskToDelete = tasks.find((task) => task.id === taskId);
          if (taskToDelete) onDelete(taskToDelete);
          break;
        case "finalize":
          const taskToFinalize = tasks.find((task) => task.id === taskId);
          if (taskToFinalize) onFinalize(taskToFinalize);
          break;
      }

      // Limpiar el estado de carga
      setTimeout(() => {
        setLoadingTaskAction({ id: null, action: null });
      }, 300);
    }, 300);
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
          {isAdmin && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleActionStart(row.original.id, "edit")}
                disabled={loadingTaskAction.id === row.original.id}
              >
                {loadingTaskAction.id === row.original.id &&
                loadingTaskAction.action === "edit" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Edit className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleActionStart(row.original.id, "delete")}
                disabled={loadingTaskAction.id === row.original.id}
              >
                {loadingTaskAction.id === row.original.id &&
                loadingTaskAction.action === "delete" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash className="h-4 w-4" />
                )}
              </Button>
            </>
          )}
          {row.original.state !== "FINALIZADO" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleActionStart(row.original.id, "finalize")}
              disabled={loadingTaskAction.id === row.original.id}
            >
              {loadingTaskAction.id === row.original.id &&
              loadingTaskAction.action === "finalize" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="text-center h-96 flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 mb-4 text-primary animate-spin" />
        <p>Cargando tareas...</p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center h-60 flex flex-col items-center justify-center">
        <p className="text-gray-500 mb-2">No hay tareas disponibles</p>
        <p className="text-sm text-gray-400">
          Prueba a cambiar los filtros o crear una nueva tarea
        </p>
      </div>
    );
  }

  return <DataTable columns={columns} data={tasks} />;
}
