import { Button } from "@/components/ui/button";
import { DataTable, type ColumnDef } from "@/components/ui/table";
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Edit,
  Trash,
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
          {isAdmin && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(row.original)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(row.original)}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </>
          )}
          {row.original.state !== "FINALIZADO" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFinalize(row.original)}
            >
              <CheckCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="text-center h-96 flex items-center justify-center">
        <p>Cargando tareas...</p>
      </div>
    );
  }

  return <DataTable columns={columns} data={tasks} />;
}
