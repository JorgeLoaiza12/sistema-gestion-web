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
import { Loader2 } from "lucide-react";

interface FinalizeTaskFormProps {
  isOpen: boolean;
  task: Task | null;
  onSave: (data: FinalizeTaskData) => Promise<void>;
  onClose: () => void;
}

export default function FinalizeTaskForm({
  isOpen,
  task,
  onSave,
  onClose,
}: FinalizeTaskFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finalizeForm, setFinalizeForm] = useState<FinalizeTaskData>({
    taskId: 0,
    technicalReport: "",
    observations: "",
    hoursWorked: 1,
    mediaUrls: [],
    endDate: getTodayISOString(), // Utiliza la función de utilidad para obtener la fecha actual correcta
  });

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
  }, [task, isOpen]);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await onSave(finalizeForm);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Finalizar Tarea</DialogTitle>
        </DialogHeader>
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
              disabled={isSubmitting}
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
              disabled={isSubmitting}
            />
          </FormField>

          <FormField>
            <FormLabel>Horas trabajadas</FormLabel>
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
              disabled={isSubmitting}
            />
            <div className="text-sm text-gray-500 mt-1">
              Total de horas trabajadas:{" "}
              {formatNumber(finalizeForm.hoursWorked)}
            </div>
          </FormField>

          <FormField>
            <FormLabel>Fecha de finalización</FormLabel>
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
              disabled={isSubmitting}
            />
          </FormField>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              "Finalizar Tarea"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
