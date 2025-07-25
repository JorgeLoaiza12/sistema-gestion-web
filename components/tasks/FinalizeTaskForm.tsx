// web/components/tasks/FinalizeTaskForm.tsx
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
import {
  Task,
  FinalizeTaskData,
  uploadTaskImageFormData,
} from "@/services/tasks";
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
  PenTool,
} from "lucide-react";
import SignatureCanvas from "react-signature-canvas";

interface FinalizeTaskFormProps {
  isOpen: boolean;
  task: Task | null;
  onSave: (data: FinalizeTaskData) => Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
}

interface StagedFile {
  file: File;
  previewUrl: string;
}

// Helper para convertir base64 a File
const base64ToFile = (base64: string, filename: string): File => {
  const arr = base64.split(",");
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/png";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

export default function FinalizeTaskForm({
  isOpen,
  task,
  onSave,
  onClose,
  isLoading = false,
}: FinalizeTaskFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [finalizeForm, setFinalizeForm] = useState<Partial<FinalizeTaskData>>({
    taskId: 0,
    technicalReport: "",
    observations: "",
    hoursWorked: 1,
    mediaUrls: [],
    nameWhoReceives: "",
    positionWhoReceives: "",
    endDate: getTodayISOString(),
  });

  const [stagedWorkImages, setStagedWorkImages] = useState<StagedFile[]>([]);
  const [stagedWhoReceivesImage, setStagedWhoReceivesImage] =
    useState<StagedFile | null>(null);

  const fileInputWhoReceivesRef = useRef<HTMLInputElement>(null);
  const fileInputWorkRef = useRef<HTMLInputElement>(null);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const signaturePad = useRef<SignatureCanvas | null>(null);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (task?.id) {
      const technicians = task.assignedWorkers
        ? task.assignedWorkers.map((assignment) => assignment.worker.name)
        : [];

      setFinalizeForm({
        taskId: task.id,
        technicalReport: task.technicalReport || "",
        observations: task.observations || "",
        hoursWorked: task.hoursWorked || 1,
        mediaUrls: task.mediaUrls || [],
        nameWhoReceives: task.metadata?.receivedBy?.name || "",
        positionWhoReceives: task.metadata?.receivedBy?.position || "",
        endDate: getTodayISOString(),
      });

      setStagedWorkImages([]);
      setStagedWhoReceivesImage(null);
      setSignatureDataUrl(task.metadata?.receivedBy?.signatureUrl || null);
    }
    setValidationError(null);
  }, [task, isOpen]);

  const handleUploadWhoReceivesImage = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setStagedWhoReceivesImage({ file, previewUrl });

    if (fileInputWhoReceivesRef.current) {
      fileInputWhoReceivesRef.current.value = "";
    }
  };

  const handleUploadWorkImage = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files) return;

    const newStagedFiles = Array.from(files).map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setStagedWorkImages((prev) => [...prev, ...newStagedFiles]);

    if (fileInputWorkRef.current) {
      fileInputWorkRef.current.value = "";
    }
  };

  const handleRemoveStagedWorkImage = (indexToRemove: number) => {
    setStagedWorkImages((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
  };

  const handleRemoveExistingWorkImage = (urlToRemove: string) => {
    setFinalizeForm((prev) => ({
      ...prev,
      mediaUrls: (prev.mediaUrls || []).filter((url) => url !== urlToRemove),
    }));
  };

  const handleSaveSignature = () => {
    if (signaturePad.current) {
      if (signaturePad.current.isEmpty()) {
        setValidationError("Por favor, provea una firma.");
        return;
      }
      const canvas = signaturePad.current.getCanvas();
      const newCanvas = document.createElement("canvas");
      newCanvas.width = canvas.width;
      newCanvas.height = canvas.height;
      const ctx = newCanvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, newCanvas.width, newCanvas.height);
        ctx.drawImage(canvas, 0, 0);
      }
      const signatureB64 = newCanvas.toDataURL("image/png");

      setSignatureDataUrl(signatureB64);
      setIsSignatureModalOpen(false);
      setValidationError(null);
    }
  };

  const handleSubmit = async () => {
    setValidationError(null);
    if (!finalizeForm.technicalReport) {
      setValidationError("El informe técnico es obligatorio");
      return;
    }
    if (!finalizeForm.hoursWorked || finalizeForm.hoursWorked <= 0) {
      setValidationError("Las horas trabajadas deben ser mayores a 0");
      return;
    }
    if (!finalizeForm.nameWhoReceives) {
      setValidationError("El nombre de quien recibe es obligatorio");
      return;
    }
    if (!finalizeForm.positionWhoReceives) {
      setValidationError("El cargo de quien recibe es obligatorio");
      return;
    }

    setIsSubmitting(true);

    try {
      let uploadedWhoReceivesUrl: string | null =
        task?.metadata?.receivedBy?.imageUrl || null;
      if (stagedWhoReceivesImage) {
        uploadedWhoReceivesUrl = await uploadTaskImageFormData(
          stagedWhoReceivesImage.file,
          "who-receives"
        );
      }

      let uploadedSignatureUrl: string | null = signatureDataUrl;
      if (signatureDataUrl && signatureDataUrl.startsWith("data:image")) {
        const signatureFile = base64ToFile(
          signatureDataUrl,
          `signature-${task?.id}.png`
        );
        uploadedSignatureUrl = await uploadTaskImageFormData(
          signatureFile,
          "signatures"
        );
      }

      const uploadedWorkImageUrls = await Promise.all(
        stagedWorkImages.map((stagedFile) =>
          uploadTaskImageFormData(stagedFile.file, "tasks")
        )
      );

      const finalMediaUrls = [
        ...(finalizeForm.mediaUrls || []),
        ...uploadedWorkImageUrls,
      ];

      const finalData: FinalizeTaskData = {
        taskId: finalizeForm.taskId!,
        technicalReport: finalizeForm.technicalReport,
        observations: finalizeForm.observations,
        hoursWorked: finalizeForm.hoursWorked,
        mediaUrls: finalMediaUrls,
        endDate: finalizeForm.endDate,
        nameWhoReceives: finalizeForm.nameWhoReceives,
        positionWhoReceives: finalizeForm.positionWhoReceives,
        imageUrlWhoReceives: uploadedWhoReceivesUrl,
        signatureUrl: uploadedSignatureUrl,
      };

      await onSave(finalData);
    } catch (error) {
      console.error("Error al finalizar la tarea:", error);
      setValidationError(
        "Ocurrió un error al finalizar la tarea. Verifica las imágenes e intenta de nuevo."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormDisabled = isLoading || isSubmitting;

  return (
    <>
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

          <div className="space-y-4">
            <p className="font-medium">{task ? task.title : ""}</p>

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
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Total de horas trabajadas:{" "}
                {formatNumber(finalizeForm.hoursWorked || 0)}
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
              </div>
            </FormField>

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

                  {stagedWhoReceivesImage ? (
                    <div className="relative w-full h-32 bg-gray-100 rounded-md overflow-hidden">
                      <img
                        src={stagedWhoReceivesImage.previewUrl}
                        alt="Foto de quien recibe"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    task?.metadata?.receivedBy?.imageUrl && (
                      <div className="relative w-full h-32 bg-gray-100 rounded-md overflow-hidden">
                        <img
                          src={task.metadata.receivedBy.imageUrl}
                          alt="Foto de quien recibe"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputWhoReceivesRef.current?.click()}
                    disabled={isFormDisabled}
                    className="w-full"
                  >
                    {stagedWhoReceivesImage ||
                    task?.metadata?.receivedBy?.imageUrl ? (
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

              <FormField>
                <FormLabel>Firma de quien recibe (opcional)</FormLabel>
                <div className="flex flex-col gap-4">
                  {signatureDataUrl && (
                    <div className="relative w-full h-32 bg-gray-100 rounded-md overflow-hidden border">
                      <img
                        src={signatureDataUrl}
                        alt="Firma de quien recibe"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsSignatureModalOpen(true)}
                    disabled={isFormDisabled}
                    className="w-full"
                  >
                    <PenTool className="mr-2 h-4 w-4" />
                    {signatureDataUrl ? "Cambiar Firma" : "Agregar Firma"}
                  </Button>
                </div>
              </FormField>
            </div>

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
                  multiple
                />

                {(finalizeForm.mediaUrls &&
                  finalizeForm.mediaUrls.length > 0) ||
                stagedWorkImages.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 my-4">
                    {finalizeForm.mediaUrls?.map((url) => (
                      <div key={url} className="relative group">
                        <div className="h-32 bg-gray-100 rounded-md overflow-hidden">
                          <img
                            src={url}
                            alt="Imagen existente"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveExistingWorkImage(url)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          disabled={isFormDisabled}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {stagedWorkImages.map((stagedFile, index) => (
                      <div
                        key={stagedFile.previewUrl}
                        className="relative group"
                      >
                        <div className="h-32 bg-gray-100 rounded-md overflow-hidden">
                          <img
                            src={stagedFile.previewUrl}
                            alt={`Imagen nueva ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveStagedWorkImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          disabled={isFormDisabled}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputWorkRef.current?.click()}
                  disabled={isFormDisabled}
                  className="w-full mt-2"
                >
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar foto(s)
                  </>
                </Button>
              </FormField>
            </div>

            {validationError && (
              <div className="border border-red-300 rounded-md p-3 bg-red-50 text-red-800 animate-fadeIn">
                <p className="text-sm font-medium">{validationError}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isFormDisabled}
            >
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

      <Dialog
        open={isSignatureModalOpen}
        onOpenChange={setIsSignatureModalOpen}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Firma de Recepción</DialogTitle>
          </DialogHeader>
          <div className="border border-gray-300 rounded-md my-4 bg-white">
            <SignatureCanvas
              ref={signaturePad}
              penColor="black"
              canvasProps={{ className: "w-full h-48 rounded-md" }}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                signaturePad.current?.clear();
              }}
            >
              Limpiar
            </Button>
            <Button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSaveSignature();
              }}
            >
              Guardar Firma
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
