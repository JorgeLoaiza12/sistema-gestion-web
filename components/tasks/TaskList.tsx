// web/components/tasks/TaskList.tsx
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
  Eye,
  FileText as DownloadIcon, // Renombrar para evitar conflicto con el componente
} from "lucide-react";
import { Task } from "@/services/tasks";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import DownloadTaskReportButton from "@/components/tasks/DownloadTaskReportButton"; // Importar el componente

interface TaskListProps {
  tasks: Task[];
  isLoading: boolean;
  isAdmin: boolean;
  onEdit: (task: Task) => void;
  onView: (task: Task) => void;
  onDelete: (task: Task) => void;
  onFinalize: (task: Task) => void;
}

export default function TaskList({
  tasks,
  isLoading,
  isAdmin,
  onEdit,
  onView,
  onDelete,
  onFinalize,
}: TaskListProps) {
  const [loadingTaskAction, setLoadingTaskAction] = useState<{
    id: number | null;
    action: "edit" | "delete" | "finalize" | "view" | null;
  }>({ id: null, action: null });

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
    action: "edit" | "delete" | "finalize" | "view"
  ) => {
    setLoadingTaskAction({ id: taskId, action });

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
        case "view":
          const taskToView = tasks.find((task) => task.id === taskId);
          if (taskToView) onView(taskToView);
          break;
      }

      setTimeout(() => {
        setLoadingTaskAction({ id: null, action: null });
      }, 300);
    }, 300);
  };

  const columns: ColumnDef<Task>[] = [
    {
      accessorKey: "title",
      header: "Título",
      cell: ({ row }) => (
        <div
          className="cursor-pointer hover:text-primary"
          onClick={() => handleActionStart(row.original.id!, "view")}
        >
          <p className="font-medium">{row.original.title}</p>
          {row.original.description && (
            <p className="text-sm text-content-subtle truncate max-w-xs">
              {row.original.description.length > 60
                ? `${row.original.description.substring(0, 60)}...`
                : row.original.description}
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
          {(row.original.types || []).map((type) => (
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
      cell: ({ row }) => {
        const assignedWorkers = row.original.assignedWorkers || [];
        const totalWorkers = assignedWorkers.length;

        if (totalWorkers === 0) {
          return <span className="text-content-subtle">Sin asignar</span>;
        }

        const displayLimit = 2;
        const displayedWorkers = assignedWorkers.slice(0, displayLimit);
        const remainingCount = totalWorkers - displayLimit;

        return (
          <div className="flex flex-col gap-1">
            {displayedWorkers.map((assignment) => (
              <span key={assignment.workerId} className="text-sm">
                {assignment.worker.name}
              </span>
            ))}

            {remainingCount > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs text-content-subtle cursor-help">
                      + {remainingCount} más
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1 p-1">
                      {assignedWorkers.slice(displayLimit).map((assignment) => (
                        <p key={assignment.workerId} className="text-xs">
                          {assignment.worker.name}
                        </p>
                      ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleActionStart(row.original.id!, "view")}
            disabled={loadingTaskAction.id === row.original.id}
          >
            {loadingTaskAction.id === row.original.id &&
            loadingTaskAction.action === "view" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>

          {isAdmin && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleActionStart(row.original.id!, "edit")}
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
                onClick={() => handleActionStart(row.original.id!, "delete")}
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
              onClick={() => handleActionStart(row.original.id!, "finalize")}
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
          {/* Botón de descarga de informe para ADMIN y tareas FINALIZADAS */}
          {isAdmin &&
            row.original.state === "FINALIZADO" &&
            row.original.id && (
              <DownloadTaskReportButton
                taskId={row.original.id}
                variant="ghost" // Cambiado a ghost para consistencia con otros botones de acción
                size="sm"
                label="" // Sin etiqueta para que solo muestre el icono
                showIcon={true}
                className="p-0 h-auto w-auto" // Ajustar padding y tamaño
              />
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
