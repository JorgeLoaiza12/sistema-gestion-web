import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Download, Loader2 } from "lucide-react";
import { downloadTaskReport } from "@/services/tasks";
import { useNotification } from "@/contexts/NotificationContext";

interface DownloadTaskReportButtonProps {
  taskId: number | string;
  variant?: "default" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showIcon?: boolean;
  label?: string;
}

export default function DownloadTaskReportButton({
  taskId,
  variant = "outline",
  size = "sm",
  className,
  showIcon = true,
  label = "Descargar Informe",
}: DownloadTaskReportButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const { addNotification } = useNotification();

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const blob = await downloadTaskReport(taskId.toString());

      // Crear un enlace para descargar el archivo
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `InformeTecnico-${taskId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      addNotification("success", "Informe descargado correctamente");
    } catch (error) {
      console.error("Error al descargar el informe:", error);
      addNotification("error", "Error al descargar el informe técnico");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDownload}
      disabled={isDownloading}
      className={className}
    >
      {isDownloading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Descargando...
        </>
      ) : (
        <>
          {showIcon && <FileText className="h-4 w-4 mr-2" />}
          {label}
        </>
      )}
    </Button>
  );
}
