"use client";

import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  QuotationsParams,
  type Quotation,
  deleteQuotation,
  getQuotationsData,
  updateQuotationStatus,
} from "@/services/quotations";
import { debounce } from "lodash";
import QuotationsTable from "@/components/quotes/QuotationsTable";
import QuotationForm from "@/components/quotes/QuotationForm";

export default function QuotesPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [pagination, setPagination] = useState<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentQuotation, setCurrentQuotation] = useState<Quotation | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<QuotationsParams>({
    page: 1,
    limit: 10,
    search: "",
    clientId: undefined,
    status: undefined,
  });
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [quotationToDelete, setQuotationToDelete] = useState<Quotation | null>(
    null
  );
  const [isDeletingQuotation, setIsDeletingQuotation] = useState(false);
  const [selectedClientFilter, setSelectedClientFilter] =
    useState<string>("all");
  const [selectedStatusFilter, setSelectedStatusFilter] =
    useState<string>("all");

  // Estados disponibles para las cotizaciones
  const QUOTATION_STATUSES = [
    {
      value: "SENT",
      label: "Enviada",
      icon: <Calendar className="h-4 w-4 mr-2" />,
    },
    {
      value: "APPROVED",
      label: "Aprobada",
      icon: <CheckCircle className="h-4 w-4 mr-2" />,
    },
    {
      value: "REJECTED",
      label: "Rechazada",
      icon: <XCircle className="h-4 w-4 mr-2" />,
    },
  ];

  // Extraer clientes únicos de las cotizaciones para el filtro
  const clientsForFilter = useMemo(() => {
    const uniqueClients = new Map();

    quotations.forEach((quotation) => {
      if (quotation.client && quotation.client.id) {
        uniqueClients.set(quotation.client.id, {
          id: quotation.client.id,
          name: quotation.client.name,
        });
      }
    });

    return Array.from(uniqueClients.values());
  }, [quotations]);

  // Cargar datos con los filtros aplicados
  const fetchQuotations = async (params: QuotationsParams = {}) => {
    try {
      setIsLoading(true);
      const data = await getQuotationsData(params);
      setQuotations(data.quotations);
      setPagination(data.pagination);
      setError(null);
    } catch (err) {
      console.error("Error fetching quotations:", err);
      setError(
        "Error al cargar las cotizaciones. Por favor, intenta de nuevo."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setFilters({
      page: 1,
      limit: 10,
      search: "",
      clientId: undefined,
      status: undefined,
    });
  }, []);

  useEffect(() => {
    if (Object.keys(filters).length === 0) return;

    fetchQuotations(filters);
  }, [filters]);

  // Implementar búsqueda con debounce
  const debouncedSearch = debounce((value: string) => {
    setFilters((prev) => ({
      ...prev,
      search: value,
      page: 1, // Resetear página al buscar
    }));
  }, 500);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    debouncedSearch(e.target.value);
  };

  const handleClientFilterChange = (value: string) => {
    setSelectedClientFilter(value);
    setFilters((prev) => ({
      ...prev,
      clientId: value && value !== "all" ? parseInt(value) : undefined,
      page: 1, // Resetear página al cambiar filtro
    }));
  };

  const handleStatusFilterChange = (value: string) => {
    setSelectedStatusFilter(value);
    setFilters((prev) => ({
      ...prev,
      status: value && value !== "all" ? value : undefined,
      page: 1, // Resetear página al cambiar filtro
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({
      ...prev,
      page,
    }));
  };

  const handleAddQuotation = () => {
    setIsEditing(true);
    setCurrentQuotation(null);
  };

  const handleEditQuotation = (quotation: Quotation) => {
    setIsEditing(true);
    setCurrentQuotation(quotation);
  };

  const openDeleteConfirm = (quotation: Quotation) => {
    setQuotationToDelete(quotation);
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteQuotation = async () => {
    if (!quotationToDelete || !quotationToDelete.id) return;

    try {
      setIsDeletingQuotation(true);
      await deleteQuotation(quotationToDelete.id);

      // Recargar los datos para reflejar los cambios
      fetchQuotations(filters);

      setError(null);
    } catch (err) {
      setError("Error al eliminar la cotización");
      console.error(err);
    } finally {
      setIsDeletingQuotation(false);
      setIsDeleteConfirmOpen(false);
      setQuotationToDelete(null);
    }
  };

  const handleSaveQuotation = async () => {
    // Recargar para reflejar los cambios
    fetchQuotations(filters);
    setIsEditing(false);
    setCurrentQuotation(null);
  };

  const handleStatusChange = async (quotationId: string, newStatus: string) => {
    try {
      await updateQuotationStatus(quotationId, newStatus);
      // Recargar datos para reflejar el cambio
      fetchQuotations(filters);
    } catch (err) {
      setError("Error al actualizar el estado de la cotización");
      console.error(err);
    }
  };

  // Componente de carga (loading)
  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-content-emphasis">
            Cotizaciones
          </h1>
          <p className="text-content-subtle mt-2">
            Gestiona tus cotizaciones para clientes
          </p>
        </div>

        <div className="h-[500px] w-full flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
          <p>Cargando cotizaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-content-emphasis">
          Cotizaciones
        </h1>
        <p className="text-content-subtle mt-2">
          Gestiona tus cotizaciones para clientes
        </p>
      </div>

      <Card className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h2 className="text-xl font-semibold">Lista de Cotizaciones</h2>

          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full md:w-auto">
            <div className="flex flex-col md:flex-row items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 w-full md:w-auto">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por título o cliente..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-8 w-full"
                />
              </div>

              {clientsForFilter.length > 0 && (
                <Select
                  value={selectedClientFilter}
                  onValueChange={handleClientFilterChange}
                >
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filtrar por cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los clientes</SelectItem>
                    {clientsForFilter.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Select
                value={selectedStatusFilter}
                onValueChange={handleStatusFilterChange}
              >
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {QUOTATION_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      <div className="flex items-center">
                        {status.icon}
                        {status.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleAddQuotation} className="w-full md:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Cotización
            </Button>
          </div>
        </div>

        <QuotationsTable
          quotations={quotations}
          pagination={pagination}
          isLoading={isLoading}
          filters={filters}
          onEdit={handleEditQuotation}
          onDelete={openDeleteConfirm}
          onPageChange={handlePageChange}
          onStatusChange={handleStatusChange}
          searchTerm={searchTerm}
          statusOptions={QUOTATION_STATUSES}
        />
      </Card>

      {error && <div className="text-center text-red-500">{error}</div>}

      {isEditing && (
        <QuotationForm
          quotation={currentQuotation}
          onSave={handleSaveQuotation}
          onCancel={() => {
            setIsEditing(false);
            setCurrentQuotation(null);
          }}
          statusOptions={QUOTATION_STATUSES}
        />
      )}

      <ConfirmDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        title="Eliminar Cotización"
        description={`¿Estás seguro que deseas eliminar la cotización "${quotationToDelete?.title}"? Esta acción no se puede deshacer.`}
        onConfirm={handleDeleteQuotation}
        confirmLabel="Eliminar"
        isLoading={isDeletingQuotation}
      />
    </div>
  );
}
