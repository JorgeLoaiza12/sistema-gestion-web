import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable, type ColumnDef } from "@/components/ui/table";
import {
  Edit,
  Trash,
  FileText,
  Download,
  User,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Mail,
  Loader2,
  Percent,
  Hash, // Icono para el ID
} from "lucide-react";
import {
  downloadQuotationPDF,
  sendQuotationEmail,
  type Quotation,
  type QuotationsParams,
} from "@/services/quotations";
import { useNotification } from "@/contexts/NotificationContext";
import { Badge } from "../ui/badge";
import { formatCurrency, roundUp } from "@/utils/number-format";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";

interface QuotationsTableProps {
  quotations: Quotation[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  } | null;
  isLoading: boolean;
  filters: QuotationsParams;
  searchTerm: string;
  statusOptions: Array<{ value: string; label: string; icon: React.ReactNode }>;
  onEdit: (quotation: Quotation) => void;
  onDelete: (quotation: Quotation) => void;
  onPageChange: (page: number) => void;
  onStatusChange: (quotationId: string, newStatus: string) => void; //
}

export default function QuotationsTable({
  quotations,
  pagination,
  isLoading,
  searchTerm,
  statusOptions,
  onEdit,
  onDelete,
  onPageChange,
  onStatusChange,
}: QuotationsTableProps) {
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState<string | null>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [selectedQuotationId, setSelectedQuotationId] = useState<string | null>(
    null
  );
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(
    null
  );
  const { addNotification } = useNotification();

  const handleDownloadPDF = async (id: string) => {
    try {
      setIsDownloading(id);
      const blob = await downloadQuotationPDF(id);

      const url = window.URL.createObjectURL(blob); //
      const a = document.createElement("a");
      a.href = url;
      a.download = `cotizacion-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      addNotification("success", "PDF descargado correctamente");
    } catch (err) {
      console.error("Error al descargar el PDF:", err);
      addNotification("error", "Error al descargar el PDF");
    } finally {
      setTimeout(() => {
        setIsDownloading(null);
      }, 500);
    }
  };

  const handleEmailButtonClick = (quotation: Quotation) => {
    //
    if (quotation.id) {
      setSelectedQuotationId(quotation.id);
      setSelectedQuotation(quotation);
      setEmailDialogOpen(true);
    }
  };

  const handleSendEmail = async () => {
    if (!selectedQuotationId) return;

    try {
      setIsSendingEmail(selectedQuotationId);
      await sendQuotationEmail(selectedQuotationId);
      addNotification("success", "Correo enviado correctamente");
    } catch (err) {
      console.error("Error al enviar el correo:", err);
      addNotification("error", "Error al enviar el correo");
      throw err;
    } finally {
      setTimeout(() => {
        //
        setIsSendingEmail(null);
        setSelectedQuotationId(null);
        setSelectedQuotation(null);
      }, 500);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "SENT":
        return <Badge variant="primary">Enviada</Badge>;
      case "APPROVED":
        return <Badge variant="success">Aprobada</Badge>; //
      case "REJECTED":
        return <Badge variant="destructive">Rechazada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const columns: ColumnDef<Quotation>[] = [
    {
      id: "id",
      header: () => (
        <div className="flex items-center">
          <Hash className="h-4 w-4 mr-1 text-content-subtle" />
          ID
        </div>
      ),
      cell: ({ row }) => (
        <div className="font-mono text-sm text-content-emphasis">
          {row.original.id}
        </div>
      ),
      size: 80, // Ancho fijo para la columna ID
    },
    {
      id: "title",
      header: "Título",
      cell: ({ row }) => (
        <div className="flex items-center">
          <div>
            <p className="font-medium">{row.original.title}</p> {/* */}
            {row.original.description && (
              <p className="text-sm text-content-subtle">
                {row.original.description.length > 50
                  ? `${row.original.description.substring(0, 50)}...`
                  : row.original.description}{" "}
                {/* */}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      id: "client",
      header: "Cliente",
      cell: (
        { row } //
      ) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-content-subtle" />
          <span>{row.original.client.name}</span>
        </div>
      ),
    },
    {
      id: "status",
      header: "Estado",
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      //
      id: "advancePercentage",
      header: "% Abono",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Percent className="h-4 w-4 text-content-subtle" />
          <span>
            {row.original.advancePercentage !== undefined
              ? `${row.original.advancePercentage}%` //
              : "50%"}
          </span>
        </div>
      ),
    },
    {
      id: "validUntil",
      header: "Válido hasta",
      cell: ({ row }) => {
        if (!row.original.validUntil) return <span>-</span>;
        return (
          <div className="flex items-center gap-2">
            {" "}
            {/* */}
            <Calendar className="h-4 w-4 text-content-subtle" />
            <span>
              {new Date(row.original.validUntil).toLocaleDateString()}
            </span>
          </div>
        );
      },
    },
    {
      id: "total",
      header: "Monto Total",
      cell: ({ row }) => {
        return (
          <span className="font-medium">
            {formatCurrency(row.original.amount || 0)}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => (
        <div className="flex space-x-1">
          {" "}
          {/* MODIFICADO space-x-1 para más iconos */}
          <Button //
            variant="ghost"
            size="sm"
            onClick={() => onEdit(row.original)}
            title="Editar Cotización"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost" //
            size="sm"
            onClick={() =>
              row.original.id && handleDownloadPDF(row.original.id)
            }
            disabled={!!isDownloading}
            className="relative"
            title="Descargar PDF" //
          >
            {isDownloading === row.original.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {isDownloading === row.original.id && ( //
              <span className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-md">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </span>
            )}
          </Button>
          <Button //
            variant="ghost"
            size="sm"
            onClick={() => handleEmailButtonClick(row.original)}
            disabled={!!isSendingEmail}
            className="relative"
            title="Enviar por Correo"
          >
            {isSendingEmail === row.original.id ? ( //
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
            {isSendingEmail === row.original.id && (
              <span className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-md">
                {" "}
                {/* */}
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </span>
            )}
          </Button>
          <Button
            variant="ghost" //
            size="sm"
            onClick={() => onDelete(row.original)}
            title="Eliminar Cotización"
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    //
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" /> //
          ))}
        </div>
      </div>
    );
  }

  if (quotations.length === 0) {
    return (
      <div className="text-center h-60 flex flex-col items-center justify-center">
        <FileText className="h-12 w-12 text-gray-300 mb-4" />
        <p className="text-lg font-medium text-gray-600">No hay cotizaciones</p>
        <p className="text-sm text-gray-500 mt-1">
          {" "}
          {/* */}
          {searchTerm
            ? "No se encontraron resultados para tu búsqueda"
            : "Crea tu primera cotización haciendo clic en 'Nueva Cotización'"}
        </p>
      </div>
    );
  }

  return (
    <>
      <DataTable columns={columns} data={quotations} /> {/* */}
      {pagination && (
        <div className="flex items-center justify-between mt-4 pt-2 border-t">
          <div className="text-sm text-gray-500">
            Mostrando {(pagination.page - 1) * pagination.limit + 1} -{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} de{" "}
            {pagination.total} cotizaciones {/* */}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={!pagination.hasPrevPage} //
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Página {pagination.page} de {pagination.totalPages}
            </span>
            <Button //
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={!pagination.hasNextPage}
            >
              <ChevronRight className="h-4 w-4" /> {/* */}
            </Button>
          </div>
        </div>
      )}
      {selectedQuotation && (
        <ConfirmDialog
          open={emailDialogOpen}
          onOpenChange={setEmailDialogOpen} //
          title="Enviar cotización por correo"
          description={`¿Estás seguro de enviar la cotización "${selectedQuotation.title}" por correo electrónico a ${selectedQuotation.client.name}? Se adjuntará un PDF con los detalles de la cotización.`}
          onConfirm={handleSendEmail}
          confirmLabel="Enviar correo"
          cancelLabel="Cancelar"
          isLoading={isSendingEmail === selectedQuotationId}
        /> /* */
      )}
    </>
  );
}
