// Ruta: app\(dashboard)\dashboard\agenda\page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable, type ColumnDef } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSession } from "next-auth/react";
import { useNotification } from "@/contexts/NotificationContext";
import {
  Calendar,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Clock,
  AlertTriangle,
  MapPin,
  Loader2,
  Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getWorkerTasks,
  finalizeTask,
  startTask,
  FinalizeTaskData,
  Task,
} from "@/services/tasks";
import FinalizeTaskForm from "@/components/tasks/FinalizeTaskForm";
import DownloadTaskReportButton from "@/components/tasks/DownloadTaskReportButton";
import { formatDate, formatTime, getWeekDayName } from "@/utils/date-format";
import TaskDetail from "@/components/tasks/TaskDetail";

export default function AgendaPage() {
  const { data: session, status } = useSession();
  const { addNotification } = useNotification();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStartingTask, setIsStartingTask] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"daily" | "weekly" | "monthly">(
    "weekly"
  );
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isViewingDetails, setIsViewingDetails] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [filterState, setFilterState] = useState<string>("all");
  const [isChangingDate, setIsChangingDate] = useState(false);

  const getDateRangeTitle = () => {
    const date = new Date(selectedDate);
    if (viewMode === "daily") {
      return formatDate(date, "dd MMMM");
    }

    if (viewMode === "weekly") {
      const day = date.getDay();
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - day);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return `${formatDate(startOfWeek, "dd MMM")} - ${formatDate(
        endOfWeek,
        "dd MMM"
      )}`;
    }

    if (viewMode === "monthly") {
      return formatDate(date, "MMMM");
    }

    return formatDate(date);
  };

  const fetchWorkerTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.append("date", selectedDate);
      queryParams.append("view", viewMode);

      const data = await getWorkerTasks(queryParams.toString());

      if (data && data.tasks) {
        setTasks(data.tasks);
        addNotification("success", "Tareas cargadas correctamente");
      } else {
        setTasks([]);
        console.error("Formato de datos inválido:", data);
      }
    } catch (error) {
      console.error("Error al cargar tareas:", error);
      addNotification("error", "Error al cargar tareas");
      setTasks([]);
    } finally {
      setIsLoading(false);
      setIsChangingDate(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, viewMode]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchWorkerTasks();
    } else if (status === "unauthenticated") {
      setTasks([]);
      setIsLoading(false);
      setIsChangingDate(false);
    }
  }, [status, fetchWorkerTasks]);

  const handleStartTask = async (task: Task) => {
    try {
      setIsStartingTask(task.id);
      const result = await startTask(task.id);
      if (result && result.task) {
        setTasks((prev) =>
          prev.map((t) => (t.id === result.task.id ? result.task : t))
        );
        addNotification("success", "Tarea iniciada correctamente");
      } else {
        throw new Error("No se pudo iniciar la tarea");
      }
    } catch (error) {
      console.error("Error iniciando tarea:", error);
      addNotification("error", "Error al iniciar la tarea");
    } finally {
      setIsStartingTask(null);
    }
  };

  const goToPreviousDate = () => {
    setIsChangingDate(true);
    const date = new Date(selectedDate);
    if (viewMode === "daily") {
      date.setDate(date.getDate() - 1);
    } else if (viewMode === "weekly") {
      date.setDate(date.getDate() - 7);
    } else if (viewMode === "monthly") {
      date.setMonth(date.getMonth() - 1);
    }

    setSelectedDate(date.toISOString().split("T")[0]);
  };

  const goToNextDate = () => {
    setIsChangingDate(true);
    const date = new Date(selectedDate);
    if (viewMode === "daily") {
      date.setDate(date.getDate() + 1);
    } else if (viewMode === "weekly") {
      date.setDate(date.getDate() + 7);
    } else if (viewMode === "monthly") {
      date.setMonth(date.getMonth() + 1);
    }

    setSelectedDate(date.toISOString().split("T")[0]);
  };

  const goToToday = () => {
    setIsChangingDate(true);
    setSelectedDate(new Date().toISOString().split("T")[0]);
  };

  const handleFinalizeSubmit = async (data: FinalizeTaskData) => {
    try {
      const result = await finalizeTask(data);
      if (result && result.task) {
        setTasks((prev) =>
          prev.map((t) => (t.id === result.task.id ? result.task : t))
        );
        addNotification("success", "Tarea finalizada correctamente");
        setIsFinalizing(false);
        setCurrentTask(null);
      } else {
        throw new Error("No se pudo finalizar la tarea");
      }
    } catch (error) {
      console.error("Error finalizando tarea:", error);
      addNotification("error", "Error al finalizar la tarea");
    }
  };

  const handleViewDetails = (task: Task) => {
    setCurrentTask(task);
    setIsViewingDetails(true);
  };

  const getStateDisplay = (state: string) => {
    switch (state) {
      case "PENDIENTE":
        return (
          <Badge variant="warning" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Pendiente</span>
          </Badge>
        );
      case "EN_CURSO":
        return (
          <Badge variant="info" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>En curso</span>
          </Badge>
        );
      case "FINALIZADO":
        return (
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            <span>Finalizado</span>
          </Badge>
        );
      default:
        return <Badge variant="secondary">{state}</Badge>;
    }
  };

  const isTaskOverdue = (task: Task) => {
    if (task.state === "FINALIZADO") return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const taskDate = new Date(task.startDate);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate < today;
  };

  const filteredTasks = tasks.filter((task) => {
    if (filterState === "all") return true;
    if (filterState === "overdue") return isTaskOverdue(task);
    return task.state === filterState;
  });

  const renderTaskCard = (task: Task) => {
    const date = new Date(task.startDate);
    const isTaskStarting = isStartingTask === task.id;

    return (
      <Card key={task.id} className="mb-4 overflow-hidden">
        <div className="p-4 border-b">
          <div className="flex justify-between items-start mb-1">
            <div className="font-medium text-lg">{task.title}</div>
            {getStateDisplay(task.state)}
          </div>
          {task.description && (
            <p className="text-sm text-content-subtle mb-2 line-clamp-2">
              {task.description}
            </p>
          )}
        </div>

        <div className="p-4 border-b bg-accent/10">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-content-subtle">Fecha</p>
              <div className="flex items-center">
                <Calendar className="h-3 w-3 mr-1 text-content-subtle" />
                <span className="text-sm">{formatDate(date)}</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-content-subtle">Hora</p>
              <div className="flex items-center">
                <Clock className="h-3 w-3 mr-1 text-content-subtle" />
                <span className="text-sm">
                  {formatTime(date)} - {getWeekDayName(date, true)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="mb-3">
            <p className="text-xs font-medium text-content-subtle mb-1">
              Cliente
            </p>
            {task.client ? (
              <div>
                <p className="text-sm font-medium">{task.client.name}</p>
                {task.client.address && (
                  <div className="text-xs text-content-subtle flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    <span className="truncate">{task.client.address}</span>
                  </div>
                )}
              </div>
            ) : (
              <span className="text-sm text-content-subtle">Sin cliente</span>
            )}
          </div>

          <div className="flex flex-wrap gap-1 mb-4">
            {task.types &&
              task.types.map((type) => (
                <Badge key={type} variant="outline" className="text-xs">
                  {type}
                </Badge>
              ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {task.state === "PENDIENTE" && (
              <Button
                variant="default"
                size="sm"
                className="flex-1"
                onClick={() => handleStartTask(task)}
                disabled={
                  isTaskStarting === task.id || status !== "authenticated"
                }
              >
                {isTaskStarting === task.id ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Iniciando...
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4 mr-1" />
                    Iniciar
                  </>
                )}
              </Button>
            )}
            {task.state === "EN_CURSO" && (
              <Button
                variant="default"
                size="sm"
                className="flex-1"
                onClick={() => {
                  setCurrentTask(task);
                  setIsFinalizing(true);
                }}
                disabled={status !== "authenticated"}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Finalizar
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => handleViewDetails(task)}
            >
              <Eye className="h-4 w-4 mr-1" />
              Ver Detalles
            </Button>
            {/* Se elimina el botón de descargar informe para el trabajador
            {task.state === "FINALIZADO" && task.id && session?.user?.role === "ADMIN" && (
              <DownloadTaskReportButton
                taskId={task.id}
                variant="outline"
                size="sm"
                label="Descargar"
                showIcon={true}
                className="flex-1"
              />
            )}
            */}
          </div>
        </div>
      </Card>
    );
  };

  const columns: ColumnDef<Task>[] = [
    {
      accessorKey: "title",
      header: "Título",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.title}</div>
          {row.original.description && (
            <div className="text-sm text-content-subtle truncate max-w-md">
              {row.original.description}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "startDate",
      header: "Fecha y Hora",
      cell: ({ row }) => {
        const date = new Date(row.original.startDate);
        return (
          <div className="space-y-1">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1 text-content-subtle" />
              <span>{formatDate(date)}</span>
            </div>
            <div className="text-sm text-content-subtle">
              {formatTime(date)} - {getWeekDayName(date)}
            </div>
            {isTaskOverdue(row.original) && (
              <div className="flex items-center text-error text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                <span>Vencida</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "client",
      header: "Cliente",
      cell: ({ row }) => (
        <div>
          {row.original.client ? (
            <>
              <div className="font-medium">{row.original.client.name}</div>
              {row.original.client.address && (
                <div className="text-sm text-content-subtle flex items-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  {row.original.client.address}
                </div>
              )}
            </>
          ) : (
            <span className="text-content-subtle">Sin cliente</span>
          )}
        </div>
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
          {row.original.types &&
            row.original.types.map((type) => (
              <Badge key={type} variant="outline" className="text-xs">
                {type}
              </Badge>
            ))}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          {row.original.state === "PENDIENTE" && (
            <Button
              variant="default"
              size="sm"
              onClick={() => handleStartTask(row.original)}
              disabled={
                isStartingTask === row.original.id || status !== "authenticated"
              }
            >
              {isStartingTask === row.original.id ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Iniciando...
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 mr-1" />
                  Iniciar
                </>
              )}
            </Button>
          )}
          {row.original.state === "EN_CURSO" && (
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                setCurrentTask(row.original);
                setIsFinalizing(true);
              }}
              disabled={status !== "authenticated"}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Finalizar
            </Button>
          )}
          {/* Se elimina el botón de descargar informe para el trabajador
          {row.original.state === "FINALIZADO" && row.original.id && session?.user?.role === "ADMIN" && (
            <DownloadTaskReportButton
              taskId={row.original.id}
              variant="outline"
              size="sm"
              label="Descargar"
              showIcon={true}
            />
          )}
          */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewDetails(row.original)}
          >
            <Eye className="h-4 w-4 mr-1" />
            Ver Detalles
          </Button>
        </div>
      ),
    },
  ];

  if (
    status === "loading" ||
    (isLoading && tasks.length === 0 && status === "authenticated")
  ) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Agenda</h1>
          <p className="text-content-subtle mt-1">
            Gestiona tus tareas asignadas y reportes técnicos
          </p>
        </div>

        <div className="h-[500px] w-full flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
          <p>Cargando tareas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Agenda</h1>
        <p className="text-content-subtle mt-1">
          Gestiona tus tareas asignadas y reportes técnicos
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPreviousDate}
            title="Anterior"
            disabled={isChangingDate || status !== "authenticated"}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            onClick={goToToday}
            className="whitespace-nowrap"
            disabled={isChangingDate || status !== "authenticated"}
          >
            {isChangingDate && status === "authenticated" ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Hoy
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={goToNextDate}
            title="Siguiente"
            disabled={isChangingDate || status !== "authenticated"}
          >
            <ArrowRight className="h-4 w-4" />
          </Button>

          <h2 className="text-lg font-semibold px-2">{getDateRangeTitle()}</h2>
        </div>

        <div className="flex flex-col md:flex-row gap-2">
          <Select
            value={viewMode}
            onValueChange={(value: "daily" | "weekly" | "monthly") => {
              setIsChangingDate(true);
              setViewMode(value);
            }}
            disabled={isChangingDate || status !== "authenticated"}
          >
            <SelectTrigger className="w-full md:w-32">
              <SelectValue placeholder="Vista" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Diaria</SelectItem>
              <SelectItem value="weekly">Semanal</SelectItem>
              <SelectItem value="monthly">Mensual</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filterState}
            onValueChange={setFilterState}
            disabled={isChangingDate || status !== "authenticated"}
          >
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="PENDIENTE">Pendientes</SelectItem>
              <SelectItem value="EN_CURSO">En Curso</SelectItem>
              <SelectItem value="FINALIZADO">Finalizados</SelectItem>
              <SelectItem value="overdue">Vencidos</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setIsChangingDate(true);
              setSelectedDate(e.target.value);
            }}
            className="w-full md:w-auto"
            disabled={isChangingDate || status !== "authenticated"}
          />
        </div>
      </div>

      {status !== "authenticated" && !isLoading && (
        <div className="text-center py-12 bg-accent/10 rounded-lg">
          <Calendar className="h-12 w-12 mx-auto text-content-subtle mb-2" />
          <h3 className="text-lg font-medium">No has iniciado sesión</h3>
          <p className="text-content-subtle">
            Por favor, inicia sesión para ver y gestionar tus tareas.
          </p>
        </div>
      )}

      {status === "authenticated" && (
        <>
          <div className="lg:hidden">
            {filteredTasks.length === 0 && !isLoading ? (
              <div className="text-center py-12 bg-accent/10 rounded-lg">
                <Calendar className="h-12 w-12 mx-auto text-content-subtle mb-2" />
                <h3 className="text-lg font-medium">No hay tareas</h3>
                <p className="text-content-subtle">
                  No se encontraron tareas para el período seleccionado
                </p>
              </div>
            ) : (
              filteredTasks.map((task) => renderTaskCard(task))
            )}
          </div>

          <div className="hidden lg:block">
            <Card>
              <DataTable
                columns={columns}
                data={filteredTasks}
                isLoading={isLoading}
              />
            </Card>
          </div>
        </>
      )}

      <FinalizeTaskForm
        isOpen={isFinalizing && status === "authenticated"}
        task={currentTask}
        onSave={handleFinalizeSubmit}
        onClose={() => {
          setIsFinalizing(false);
          setCurrentTask(null);
        }}
      />

      {isViewingDetails && currentTask && (
        <Dialog
          open={isViewingDetails}
          onOpenChange={(open) => {
            if (!open) {
              setIsViewingDetails(false);
              setCurrentTask(null);
            }
          }}
        >
          <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalles de la Tarea</DialogTitle>
            </DialogHeader>
            <TaskDetail
              task={currentTask}
              isAdmin={session?.user?.role === "ADMIN"} // Solo los admins pueden ver los detalles del informe
              onEdit={() => {}}
              onDelete={() => {}}
              onStart={(taskToStart) => {
                if (status === "authenticated") {
                  handleStartTask(taskToStart);
                }
              }}
              onFinalize={(taskToFinalize) => {
                if (status === "authenticated") {
                  setIsViewingDetails(false);
                  setCurrentTask(taskToFinalize);
                  setIsFinalizing(true);
                }
              }}
            />
            <div className="flex justify-end mt-4">
              <Button
                onClick={() => setIsViewingDetails(false)}
                variant="outline"
              >
                Cerrar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}