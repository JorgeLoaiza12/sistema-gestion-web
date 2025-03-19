import { useState } from "react";
import { Task } from "@/services/tasks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  Edit,
  Trash,
  CheckCircle,
  Loader2,
} from "lucide-react";
import QuotationInfo from "../quotes/QuotationInfo";
import { formatDateSafely } from "@/utils/date-format";

interface TaskDetailProps {
  task: Task;
  isAdmin: boolean;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onFinalize: (task: Task) => void;
  onStart: (task: Task) => void;
}

export default function TaskDetail({
  task,
  isAdmin,
  onEdit,
  onDelete,
  onFinalize,
  onStart,
}: TaskDetailProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  const getStateDisplay = (state: string) => {
    switch (state) {
      case "PENDIENTE":
        return (
          <Badge variant="warning" className="mr-2">
            Pendiente
          </Badge>
        );
      case "EN_CURSO":
        return (
          <Badge variant="info" className="mr-2">
            En curso
          </Badge>
        );
      case "FINALIZADO":
        return (
          <Badge variant="success" className="mr-2">
            Finalizado
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="mr-2">
            {state}
          </Badge>
        );
    }
  };

  const handleStartTask = async () => {
    try {
      setIsStarting(true);
      await onStart(task);
    } finally {
      setIsStarting(false);
    }
  };

  const handleFinalizeTask = async () => {
    try {
      setIsFinalizing(true);
      await onFinalize(task);
    } finally {
      setIsFinalizing(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{task.title}</CardTitle>
            <div className="flex items-center mt-2">
              {getStateDisplay(task.state)}
              {task.types.map((type) => (
                <Badge key={type} variant="outline" className="mr-2">
                  {type}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex space-x-2">
            {isAdmin && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(task)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(task)}
                >
                  <Trash className="h-4 w-4 mr-1" />
                  Eliminar
                </Button>
              </>
            )}
            {task.state === "PENDIENTE" && (
              <Button
                variant="default"
                size="sm"
                onClick={handleStartTask}
                disabled={isStarting}
              >
                {isStarting ? (
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
                onClick={handleFinalizeTask}
                disabled={isFinalizing}
              >
                {isFinalizing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Finalizando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Finalizar
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Descripción de la tarea */}
        {task.description && (
          <div className="mb-4">
            <p className="text-sm text-content-subtle">{task.description}</p>
          </div>
        )}

        {/* Información de la cotización si existe */}
        {task.quotationId && <QuotationInfo quotationId={task.quotationId} />}

        {/* Información básica */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <h3 className="font-medium mb-2">Información del Cliente</h3>
            {task.client ? (
              <div className="space-y-1">
                <p className="text-sm">
                  <span className="font-medium">Nombre:</span>{" "}
                  {task.client.name}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Email:</span>{" "}
                  {task.client.email}
                </p>
                {task.client.phone && (
                  <p className="text-sm">
                    <span className="font-medium">Teléfono:</span>{" "}
                    {task.client.phone}
                  </p>
                )}
                {task.client.address && (
                  <p className="text-sm">
                    <span className="font-medium">Dirección:</span>{" "}
                    {task.client.address}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-content-subtle">
                Sin cliente asignado
              </p>
            )}
          </div>

          <div>
            <h3 className="font-medium mb-2">Fechas</h3>
            <div className="space-y-1">
              <p className="text-sm flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-content-subtle" />
                <span className="font-medium mr-1">Inicio:</span>
                {formatDateSafely(task.startDate)}
              </p>
              {task.endDate && (
                <p className="text-sm flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-content-subtle" />
                  <span className="font-medium mr-1">Fin:</span>
                  {formatDateSafely(task.endDate)}
                </p>
              )}
              {task.hoursWorked && (
                <p className="text-sm flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-content-subtle" />
                  <span className="font-medium mr-1">Horas trabajadas:</span>
                  {task.hoursWorked}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Técnicos asignados */}
        <div className="mb-4">
          <h3 className="font-medium mb-2">Técnicos Asignados</h3>
          {task.assignedWorkers && task.assignedWorkers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {task.assignedWorkers.map((assignment) => (
                <div
                  key={assignment.workerId}
                  className="flex items-center p-2 bg-muted/40 rounded"
                >
                  <div className="ml-2">
                    <p className="font-medium text-sm">
                      {assignment.worker.name}
                    </p>
                    <p className="text-xs text-content-subtle">
                      {assignment.worker.email}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-content-subtle">
              No hay técnicos asignados
            </p>
          )}
        </div>

        {/* Mostrar más detalles si la tarea está finalizada */}
        {task.state === "FINALIZADO" && (
          <div className="border-t border-border pt-4 mt-4">
            <h3 className="font-medium mb-2">Informe Técnico</h3>
            <p className="text-sm whitespace-pre-line mb-4">
              {task.technicalReport}
            </p>

            {task.observations && (
              <div className="mb-4">
                <h3 className="font-medium mb-2">Observaciones</h3>
                <p className="text-sm whitespace-pre-line">
                  {task.observations}
                </p>
              </div>
            )}

            {task.mediaUrls && task.mediaUrls.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Archivos Adjuntos</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {task.mediaUrls.map((url, index) => (
                    <a
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline break-all"
                    >
                      Archivo {index + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mostrar categorías si existen */}
        {task.categories && task.categories.length > 0 && (
          <div className="mt-4">
            <h3 className="font-medium mb-2">Categorías</h3>
            <div className="flex flex-wrap gap-1">
              {task.categories.map((category, index) => (
                <Badge key={index} variant="outline">
                  {category}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
