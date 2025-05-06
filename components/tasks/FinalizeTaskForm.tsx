import { useState, useEffect, useRef } from "react";
import { FormField, FormLabel, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormTextarea } from "@/components/ui/form-textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Task, FinalizeTaskData } from "@/services/tasks";
import { uploadTaskImage, compressImage, blobToFile } from "@/services/uploads";
import { formatNumber } from "@/utils/number-format";
import { getTodayISOString } from "@/utils/date-format";
import {
  Loader2,
  CheckCircle2,
  Upload,
  Edit,
  Plus,
  X,
  Image,
  Camera,
  Users,
} from "lucide-react";

interface FinalizeTaskFormProps {
  isOpen: boolean;
  task: Task | null;
  onSave: (data: FinalizeTaskData) => Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
}

export default function FinalizeTaskForm({
  isOpen,
  task,
  onSave,
  onClose,
  isLoading = false,
}: FinalizeTaskFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [finalizeForm, setFinalizeForm] = useState<FinalizeTaskData>({
    taskId: 0,
    technicalReport: "",
    observations: "",
    hoursWorked: 1,
    mediaUrls: [],
    nameWhoReceives: "",
    positionWhoReceives: "",
    imageUrlWhoReceives: "",
    endDate: getTodayISOString(),
    technicians: [],
  });
  const [progress, setProgress] = useState(0);
  const [isUploadingWhoReceives, setIsUploadingWhoReceives] = useState(false);
  const [isUploadingWork, setIsUploadingWork] = useState(false);
  const fileInputWhoReceivesRef = useRef<HTMLInputElement>(null);
  const fileInputWorkRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (task?.id) {
      // Extraer nombres de técnicos de los asignados a la tarea
      const technicians = task.assignedWorkers
        ? task.assignedWorkers.map((assignment) => assignment.worker.name)
        : [];

      setFinalizeForm({
        taskId: task.id,
        technicalReport: task.technicalReport || "",
        observations: task.observations || "",
        hoursWorked: task.hoursWorked || 1,
        mediaUrls: task.mediaUrls || [],
        nameWhoReceives: "",
        positionWhoReceives: "",
        imageUrlWhoReceives: "",
        endDate: getTodayISOString(),
        technicians: technicians, // Agregar lista de técnicos asignados
      });
    }
    setValidationError(null);
  }, [task, isOpen]);

  // Simulación de progreso durante el guardado
  useEffect(() => {
    if (isSubmitting) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + 10;
        });
      }, 300);

      return () => clearInterval(interval);
    } else {
      setProgress(0);
    }
  }, [isSubmitting]);

  // Función para subir imagen quien recibe
  const handleUploadWhoReceivesImage = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploadingWhoReceives(true);
      setValidationError(null);

      // Comprimir la imagen antes de subirla
      const compressedBlob = await compressImage(files[0], 800, 0.8);
      const compressedFile = blobToFile(
        compressedBlob,
        `who-receives-${Date.now()}.${files[0].name.split(".").pop()}`,
        { type: files[0].type }
      );

      // Subir la imagen comprimida
      const imageUrl = await uploadTaskImage(compressedFile, "who-receives");

      setFinalizeForm({
        ...finalizeForm,
        imageUrlWhoReceives: imageUrl,
      });
    } catch (error) {
      console.error("Error al subir imagen:", error);
      setValidationError("No se pudo subir la imagen. Intente nuevamente.");
    } finally {
      setIsUploadingWhoReceives(false);
      // Limpiar el input
      if (fileInputWhoReceivesRef.current) {
        fileInputWhoReceivesRef.current.value = "";
      }
    }
  };

  // Función para subir imagen de trabajo
  const handleUploadWorkImage = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploadingWork(true);
      setValidationError(null);

      // Comprimir la imagen antes de subirla
      const compressedBlob = await compressImage(files[0], 1200, 0.8);
      const compressedFile = blobToFile(
        compressedBlob,
        `work-${Date.now()}.${files[0].name.split(".").pop()}`,
        { type: files[0].type }
      );

      // Subir la imagen comprimida
      const imageUrl = await uploadTaskImage(compressedFile, "work");

      // Agregar nueva imagen a las existentes
      setFinalizeForm({
        ...finalizeForm,
        mediaUrls: [...(finalizeForm.mediaUrls || []), imageUrl],
      });
    } catch (error) {
      console.error("Error al subir imagen:", error);
      setValidationError("No se pudo subir la imagen. Intente nuevamente.");
    } finally {
      setIsUploadingWork(false);
      // Limpiar el input
      if (fileInputWorkRef.current) {
        fileInputWorkRef.current.value = "";
      }
    }
  };

  // Eliminar imagen de trabajo
  const handleRemoveWorkImage = (urlToRemove: string) => {
    setFinalizeForm({
      ...finalizeForm,
      mediaUrls: (finalizeForm.mediaUrls || []).filter(
        (url) => url !== urlToRemove
      ),
    });
  };

  const handleSubmit = async () => {
    setValidationError(null);

    // Validaciones
    if (!finalizeForm.technicalReport) {
      setValidationError("El informe técnico es obligatorio");
      return;
    }

    if (finalizeForm.hoursWorked <= 0) {
      setValidationError("Las horas trabajadas deben ser mayores a 0");
      return;
    }

    // Validar nuevos campos obligatorios
    if (!finalizeForm.nameWhoReceives) {
      setValidationError("El nombre de quien recibe es obligatorio");
      return;
    }

    if (!finalizeForm.positionWhoReceives) {
      setValidationError("El cargo de quien recibe es obligatorio");
      return;
    }

    try {
      setIsSubmitting(true);

      // Aquí enviamos directamente el formulario si el usuario subió imágenes usando el formulario
      // Si no, usamos el proceso API normal

      // Comprobar si tenemos imágenes para enviar como FormData
      const hasWhoReceivesImage =
        fileInputWhoReceivesRef.current?.files?.length > 0;
      const hasWorkImages = fileInputWorkRef.current?.files?.length > 0;

      if (hasWhoReceivesImage || hasWorkImages) {
        // Crear un FormData para enviar los datos y los archivos
        const formData = new FormData();

        // Añadir los datos del formulario
        formData.append("taskId", finalizeForm.taskId.toString());
        formData.append("technicalReport", finalizeForm.technicalReport);
        if (finalizeForm.observations)
          formData.append("observations", finalizeForm.observations);
        formData.append("hoursWorked", finalizeForm.hoursWorked.toString());
        formData.append("nameWhoReceives", finalizeForm.nameWhoReceives);
        formData.append(
          "positionWhoReceives",
          finalizeForm.positionWhoReceives
        );
        if (finalizeForm.endDate)
          formData.append("endDate", finalizeForm.endDate);

        // Añadir imagen de quien recibe si existe
        if (hasWhoReceivesImage) {
          formData.append(
            "imageWhoReceives",
            fileInputWhoReceivesRef.current.files[0]
          );
        } else if (finalizeForm.imageUrlWhoReceives) {
          formData.append(
            "imageUrlWhoReceives",
            finalizeForm.imageUrlWhoReceives
          );
        }

        // Añadir URLs de imágenes ya existentes
        if (finalizeForm.mediaUrls && finalizeForm.mediaUrls.length > 0) {
          // Para enviar un array en FormData, debemos usar notación de corchetes
          finalizeForm.mediaUrls.forEach((url, i) => {
            formData.append(`mediaUrls[${i}]`, url);
          });
        }

        // Añadir las listas de técnicos
        if (finalizeForm.technicians && finalizeForm.technicians.length > 0) {
          finalizeForm.technicians.forEach((tech, i) => {
            formData.append(`technicians[${i}]`, tech);
          });
        }

        // Añadir nuevas imágenes de trabajo
        if (hasWorkImages) {
          Array.from(fileInputWorkRef.current.files).forEach((file) => {
            formData.append("image", file);
          });
        }

        // Obtener token para la petición
        const session = await import("next-auth/react").then((mod) =>
          mod.getSession()
        );
        const accessToken = session?.accessToken;

        // Enviar los datos directamente con fetch
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/tasks/finalize`,
          {
            method: "POST",
            headers: {
              ...(accessToken
                ? { Authorization: `Bearer ${accessToken}` }
                : {}),
            },
            credentials: "include",
            body: formData,
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({
            message: `Error ${response.status}: ${response.statusText}`,
          }));

          throw new Error(
            errorData.message ||
              `Error al finalizar tarea: ${response.statusText}`
          );
        }

        const result = await response.json();

        // Continuar con el flujo normal después de la operación exitosa
        setProgress(100);
        onClose();
      } else {
        // Si no hay archivos para subir, usamos el método normal
        await onSave(finalizeForm);
        setProgress(100);
      }
    } catch (error) {
      console.error("Error al finalizar la tarea:", error);
      setValidationError("Ocurrió un error al finalizar la tarea");
    } finally {
      // Retraso para asegurar que se vea la animación completa
      setTimeout(() => {
        setIsSubmitting(false);
      }, 300);
    }
  };

  // Fusionar los estados de carga
  const isFormDisabled =
    isLoading || isSubmitting || isUploadingWhoReceives || isUploadingWork;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !isFormDisabled && onClose()}
    >
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Finalizar Tarea
          </DialogTitle>
        </DialogHeader>

        {/* Barra de progreso */}
        {isSubmitting && (
          <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <div className="space-y-4">
          <p className="font-medium">{task ? task.title : ""}</p>

          {/* Mostrar los técnicos asignados */}
          {task?.assignedWorkers && task.assignedWorkers.length > 0 && (
            <div className="border rounded-md p-3 bg-blue-50">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-blue-500" />
                <h3 className="font-medium text-blue-700">
                  Técnicos asignados
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {task.assignedWorkers.map((assignment) => (
                  <Badge
                    key={assignment.workerId}
                    variant="secondary"
                    className="px-2 py-1 text-sm"
                  >
                    {assignment.worker.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

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
              disabled={isFormDisabled}
              placeholder="Describa el trabajo realizado y los resultados obtenidos"
            />
          </FormField>

          <FormField>
            <FormLabel>Observaciones</FormLabel>
            <FormTextarea
              value={finalizeForm.observations || ""}
              onChange={(e) =>
                setFinalizeForm({
                  ...finalizeForm,
                  observations: e.target.value,
                })
              }
              disabled={isFormDisabled}
              placeholder="Cualquier observación adicional (opcional)"
            />
          </FormField>

          <FormField>
            <FormLabel>Horas trabajadas</FormLabel>
            <div className="relative">
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
                disabled={isFormDisabled}
              />
              {isFormDisabled && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              )}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Total de horas trabajadas:{" "}
              {formatNumber(finalizeForm.hoursWorked)}
            </div>
          </FormField>

          <FormField>
            <FormLabel>Fecha de finalización</FormLabel>
            <div className="relative">
              <Input
                type="date"
                value={finalizeForm.endDate || ""}
                onChange={(e) =>
                  setFinalizeForm({
                    ...finalizeForm,
                    endDate: e.target.value,
                  })
                }
                required
                disabled={isFormDisabled}
              />
              {isFormDisabled && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              )}
            </div>
          </FormField>

          {/* NUEVOS CAMPOS */}
          <div className="border p-4 rounded-md bg-accent/10 space-y-4">
            <h3 className="font-medium">
              Información de quien recibe el trabajo
            </h3>

            <FormField>
              <FormLabel>Nombre de quien recibe</FormLabel>
              <Input
                value={finalizeForm.nameWhoReceives || ""}
                onChange={(e) =>
                  setFinalizeForm({
                    ...finalizeForm,
                    nameWhoReceives: e.target.value,
                  })
                }
                required
                disabled={isFormDisabled}
                placeholder="Nombre completo"
              />
            </FormField>

            <FormField>
              <FormLabel>Cargo de quien recibe</FormLabel>
              <Input
                value={finalizeForm.positionWhoReceives || ""}
                onChange={(e) =>
                  setFinalizeForm({
                    ...finalizeForm,
                    positionWhoReceives: e.target.value,
                  })
                }
                required
                disabled={isFormDisabled}
                placeholder="Ej: Administrador, Conserje, etc."
              />
            </FormField>

            <FormField>
              <FormLabel>Foto de quien recibe (opcional)</FormLabel>
              <div className="flex flex-col gap-4">
                <input
                  type="file"
                  ref={fileInputWhoReceivesRef}
                  onChange={handleUploadWhoReceivesImage}
                  accept="image/*"
                  style={{ display: "none" }}
                />

                {finalizeForm.imageUrlWhoReceives && (
                  <div className="relative w-full h-32 bg-gray-100 rounded-md overflow-hidden">
                    <img
                      src={finalizeForm.imageUrlWhoReceives}
                      alt="Firma de quien recibe"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputWhoReceivesRef.current?.click()}
                  disabled={isFormDisabled}
                  className="w-full"
                >
                  {isUploadingWhoReceives ? (
                    <div className="flex items-center">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      <span>Subiendo...</span>
                    </div>
                  ) : finalizeForm.imageUrlWhoReceives ? (
                    <>
                      <Edit className="mr-2 h-4 w-4" />
                      Cambiar imagen
                    </>
                  ) : (
                    <>
                      <Camera className="mr-2 h-4 w-4" />
                      Tomar foto de quien recibe
                    </>
                  )}
                </Button>
              </div>
            </FormField>
          </div>

          {/* Sección de fotos del trabajo realizado */}
          <div className="border p-4 rounded-md bg-accent/10 space-y-4">
            <h3 className="font-medium">Fotos del trabajo realizado</h3>

            <FormField>
              <FormLabel>Fotos de la instalación o servicio</FormLabel>
              <FormDescription>
                Agregue fotos del trabajo realizado (antes/después, detalles,
                etc.)
              </FormDescription>

              <input
                type="file"
                ref={fileInputWorkRef}
                onChange={handleUploadWorkImage}
                accept="image/*"
                style={{ display: "none" }}
              />

              {/* Grid de imágenes */}
              {finalizeForm.mediaUrls && finalizeForm.mediaUrls.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 my-4">
                  {finalizeForm.mediaUrls.map((url, index) => (
                    <div key={url} className="relative group">
                      <div className="h-32 bg-gray-100 rounded-md overflow-hidden">
                        <img
                          src={url}
                          alt={`Imagen ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveWorkImage(url)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        disabled={isFormDisabled}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputWorkRef.current?.click()}
                disabled={isFormDisabled}
                className="w-full mt-2"
              >
                {isUploadingWork ? (
                  <div className="flex items-center">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    <span>Subiendo...</span>
                  </div>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar foto
                  </>
                )}
              </Button>
            </FormField>
          </div>

          {/* Mensaje de validación */}
          {validationError && (
            <div className="border border-red-300 rounded-md p-3 bg-red-50 text-red-800 animate-fadeIn">
              <p className="text-sm font-medium">{validationError}</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isFormDisabled}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isFormDisabled}
            variant="success"
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isFormDisabled ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                <span>Finalizando...</span>
              </div>
            ) : (
              <div className="flex items-center">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                <span>Finalizar Tarea</span>
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
