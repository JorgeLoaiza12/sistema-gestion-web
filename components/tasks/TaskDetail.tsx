// C:\workspace\gestion\web\components\tasks\TaskDetail.tsx
import { useState, useEffect } from "react";
import { Task } from "@/services/tasks";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  Edit,
  Trash,
  CheckCircle,
  Loader2,
  MapPin,
  FileText,
  User,
  Briefcase,
  Image as ImageIcon,
  ExternalLink,
  Download,
  PenTool,
} from "lucide-react";
import QuotationInfo from "../quotes/QuotationInfo";
import { formatDateSafely } from "@/utils/date-format";
import DownloadTaskReportButton from "@/components/tasks/DownloadTaskReportButton";

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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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

  const ImagePreview = () => {
    if (!selectedImage) return null;

    return (
      <div
        className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
        onClick={() => setSelectedImage(null)}
      >
        <div
          className="relative max-w-4xl max-h-[90vh] w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="outline"
            size="icon"
            className="absolute right-0 top-0 bg-background z-10 m-2"
            onClick={() => setSelectedImage(null)}
          >
            ✕
          </Button>
          <div className="bg-white p-2 rounded-md">
            <img
              src={selectedImage}
              alt="Vista previa"
              className="max-h-[85vh] max-w-full object-contain mx-auto"
            />
          </div>
          <div className="mt-2 flex justify-center">
            <Button
              variant="outline"
              onClick={() => window.open(selectedImage, "_blank")}
              className="bg-background"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir en nueva pestaña
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{task.title}</CardTitle>
            <div className="flex items-center mt-2">
              {getStateDisplay(task.state)}
              {task.types &&
                task.types.map((type) => (
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
        {task.description && (
          <div className="mb-4">
            <p className="text-sm text-content-subtle">{task.description}</p>
          </div>
        )}

        {task.quotationId && <QuotationInfo quotationId={task.quotationId} />}

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
                  <p className="text-sm flex">
                    <span className="font-medium mr-1">Dirección:</span>{" "}
                    <MapPin className="h-4 w-4 mx-1 text-content-subtle" />
                    <span>{task.client.address}</span>
                  </p>
                )}
                {task.client.rut && (
                  <p className="text-sm">
                    <span className="font-medium">RUT:</span> {task.client.rut}
                  </p>
                )}
                {task.client.commune && (
                  <p className="text-sm">
                    <span className="font-medium">Comuna:</span>{" "}
                    {task.client.commune}
                  </p>
                )}
                {task.client.administrator && (
                  <p className="text-sm">
                    <span className="font-medium">Administrador:</span>{" "}
                    {task.client.administrator}
                  </p>
                )}
                {task.client.butler && (
                  <p className="text-sm">
                    <span className="font-medium">Mayordomo:</span>{" "}
                    {task.client.butler}
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
              {task.hoursWorked !== undefined && (
                <p className="text-sm flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-content-subtle" />
                  <span className="font-medium mr-1">Horas trabajadas:</span>
                  {task.hoursWorked}
                </p>
              )}
            </div>
          </div>
        </div>

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

        {task.categories && task.categories.length > 0 && (
          <div className="mb-4">
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

        {task.state === "FINALIZADO" && (
          <div className="border-t border-border pt-4 mt-4">
            <div className="bg-accent/10 p-3 rounded-md mb-4">
              <h3 className="font-medium mb-2 flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Informe Técnico
              </h3>
              <p className="text-sm whitespace-pre-line mb-4">
                {task.technicalReport}
              </p>
            </div>

            {task.observations && (
              <div className="bg-muted/30 p-3 rounded-md mb-4">
                <h3 className="font-medium mb-2">Observaciones</h3>
                <p className="text-sm whitespace-pre-line">
                  {task.observations}
                </p>
              </div>
            )}

            {task.metadata?.receivedBy && (
              <div className="mb-6 border border-border rounded-lg p-4">
                <h3 className="font-medium mb-3">Información de Recepción</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm flex items-center">
                      <User className="h-4 w-4 mr-2 text-content-subtle" />
                      <span className="font-medium mr-1">Recibido por:</span>
                      {task.metadata.receivedBy.name}
                    </p>
                    {task.metadata.receivedBy.position && (
                      <p className="text-sm flex items-center">
                        <Briefcase className="h-4 w-4 mr-2 text-content-subtle" />
                        <span className="font-medium mr-1">Cargo:</span>
                        {task.metadata.receivedBy.position}
                      </p>
                    )}
                    {task.metadata.receivedBy.date && (
                      <p className="text-sm flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-content-subtle" />
                        <span className="font-medium mr-1">
                          Fecha de recepción:
                        </span>
                        {formatDateSafely(task.metadata.receivedBy.date)}
                      </p>
                    )}
                  </div>
                  {task.metadata.receivedBy.imageUrl && (
                    <div className="flex justify-center items-center">
                      <div
                        className="relative border border-border rounded overflow-hidden cursor-pointer"
                        onClick={() =>
                          setSelectedImage(task.metadata.receivedBy.imageUrl)
                        }
                      >
                        <div className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 hover:opacity-100 transition-opacity">
                          <div className="bg-black/60 text-white p-1 rounded">
                            <ImageIcon className="h-5 w-5" />
                          </div>
                        </div>
                        <img
                          src={task.metadata.receivedBy.imageUrl}
                          alt="Firma de recepción"
                          className="max-w-full max-h-32 object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {task.mediaUrls && task.mediaUrls.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium mb-3 flex items-center">
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Imágenes Adjuntas
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {task.mediaUrls.map((url, index) => (
                    <div
                      key={index}
                      className="relative border border-border rounded-md overflow-hidden aspect-square cursor-pointer"
                      onClick={() => setSelectedImage(url)}
                    >
                      <div className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 hover:opacity-100 transition-opacity">
                        <div className="bg-black/60 text-white p-1 rounded">
                          <ImageIcon className="h-5 w-5" />
                        </div>
                      </div>
                      <img
                        src={url}
                        alt={`Adjunto ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        {isAdmin && task.state === "FINALIZADO" && task.id && (
          <DownloadTaskReportButton
            taskId={task.id}
            variant="default"
            className="w-full md:w-auto"
            label="Descargar Informe Técnico"
            showIcon
          />
        )}
      </CardFooter>

      <ImagePreview />
    </Card>
  );
}
