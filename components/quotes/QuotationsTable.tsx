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
  Check,
  X,
} from "lucide-react";
import {
  downloadQuotationPDF,
  sendQuotationEmail,
  type Quotation,
  type QuotationsParams,
} from "@/services/quotations";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotification } from "@/contexts/NotificationContext";
import { Badge } from "../ui/badge";
import { formatCurrency, roundUp } from "@/utils/number-format";

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
  onStatusChange: (quotationId: string, newStatus: string) => void;
}

export default function QuotationsTable({
  quotations,
  pagination,
  isLoading,
  filters,
  searchTerm,
  statusOptions,
  onEdit,
  onDelete,
  onPageChange,
  onStatusChange,
}: QuotationsTableProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState<string | null>(null);
  const { addNotification } = useNotification();

  // Calcular el total de una cotización
  const calculateTotal = (quotation: Quotation): number => {
    return roundUp(
      quotation.categories.reduce((categoryTotal, category) => {
        return (
          categoryTotal +
          category.items.reduce((itemTotal, item) => {
            const price = item.price || (item.product ? item.product.price : 0);
            const finalPrice = Math.ceil(price + price * 0.35); // Añadir ganancia del 35%
            return itemTotal + finalPrice * item.quantity;
          }, 0)
        );
      }, 0)
    );
  };

  const handleDownloadPDF = async (id: string) => {
    try {
      setIsDownloading(true);
      const blob = await downloadQuotationPDF(id);

      // Crear un enlace para descargar el archivo
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cotizacion-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Error al descargar el PDF:", err);
      addNotification("error", "Error al descargar el PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSendEmail = async (id: string) => {
    try {
      setIsSendingEmail(id);
      await sendQuotationEmail(id);
      addNotification("success", "Correo enviado correctamente");
    } catch (err) {
      console.error("Error al enviar el correo:", err);
      addNotification("error", "Error al enviar el correo");
    } finally {
      setIsSendingEmail(null);
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return <Badge variant="outline">Borrador</Badge>;

    switch (status) {
      case "DRAFT":
        return <Badge variant="outline">Borrador</Badge>;
      case "SENT":
        return <Badge variant="primary">Enviada</Badge>;
      case "APPROVED":
        return <Badge variant="success">Aprobada</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">Rechazada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Columnas para el DataTable
  const columns: ColumnDef<Quotation>[] = [
    {
      id: "title",
      header: "Título",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{row.original.title}</p>
            {row.original.description && (
              <p className="text-sm text-content-subtle">
                {row.original.description.length > 50
                  ? `${row.original.description.substring(0, 50)}...`
                  : row.original.description}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      id: "client",
      header: "Cliente",
      cell: ({ row }) => (
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
      id: "validUntil",
      header: "Válido hasta",
      cell: ({ row }) => {
        if (!row.original.validUntil) return <span>-</span>;
        return (
          <div className="flex items-center gap-2">
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
      header: "Total",
      cell: ({ row }) => {
        const total = calculateTotal(row.original);
        return <span className="font-medium">{formatCurrency(total)}</span>;
      },
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => (
        <div className="flex space-x-2">
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
            onClick={() =>
              row.original.id && handleDownloadPDF(row.original.id)
            }
            disabled={isDownloading}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => row.original.id && handleSendEmail(row.original.id)}
            disabled={isSendingEmail === row.original.id}
          >
            <Mail className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                {getStatusIcon(row.original.status)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {statusOptions.map((status) => (
                <DropdownMenuItem
                  key={status.value}
                  onClick={() =>
                    row.original.id &&
                    row.original.status !== status.value &&
                    onStatusChange(row.original.id, status.value)
                  }
                  disabled={row.original.status === status.value}
                  className="flex items-center"
                >
                  {status.icon}
                  {status.label}
                  {row.original.status === status.value && (
                    <Check className="h-4 w-4 ml-auto" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(row.original)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  function getStatusIcon(status?: string) {
    const statusOption = statusOptions.find(
      (option) => option.value === status
    );
    return statusOption?.icon || statusOptions[0].icon;
  }

  if (isLoading) {
    return (
      <div className="text-center h-96 flex items-center justify-center">
        <p>Cargando cotizaciones...</p>
      </div>
    );
  }

  if (quotations.length === 0) {
    return (
      <div className="text-center h-60 flex flex-col items-center justify-center">
        <FileText className="h-12 w-12 text-gray-300 mb-4" />
        <p className="text-lg font-medium text-gray-600">No hay cotizaciones</p>
        <p className="text-sm text-gray-500 mt-1">
          {searchTerm
            ? "No se encontraron resultados para tu búsqueda"
            : "Crea tu primera cotización haciendo clic en 'Nueva Cotización'"}
        </p>
      </div>
    );
  }

  return (
    <>
      <DataTable columns={columns} data={quotations} />

      {pagination && (
        <div className="flex items-center justify-between mt-4 pt-2 border-t">
          <div className="text-sm text-gray-500">
            Mostrando {(pagination.page - 1) * pagination.limit + 1} -{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} de{" "}
            {pagination.total} cotizaciones
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={!pagination.hasPrevPage}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Página {pagination.page} de {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={!pagination.hasNextPage}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
