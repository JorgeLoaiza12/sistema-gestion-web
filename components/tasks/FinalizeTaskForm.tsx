import { useState, useEffect } from "react";
import { FormField, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormTextarea } from "@/components/ui/form-textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Task, FinalizeTaskData } from "@/services/tasks";
import { formatNumber } from "@/utils/number-format";
import { getTodayISOString } from "@/utils/date-format";
import { Loader2, CheckCircle2 } from "lucide-react";

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
    endDate: getTodayISOString(), // Utiliza la función de utilidad para obtener la fecha actual correcta
  });
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (task?.id) {
      setFinalizeForm({
        taskId: task.id,
        technicalReport: task.technicalReport || "",
        observations: task.observations || "",
        hoursWorked: task.hoursWorked || 1,
        mediaUrls: task.mediaUrls || [],
        endDate: getTodayISOString(), // Usar fecha actual ajustada
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

    try {
      setIsSubmitting(true);
      await onSave(finalizeForm);
      setProgress(100);
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
  const isFormDisabled = isLoading || isSubmitting;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !isFormDisabled && onClose()}
    >
      <DialogContent className="max-w-3xl">
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
