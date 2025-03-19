"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BarChart3,
  PieChart,
  FileSpreadsheet,
  Download,
  Calendar,
  Users,
  Filter,
  Search,
  RefreshCcw,
  FileText,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  downloadReportExcel,
  downloadReportPDF,
  generateCustomReport,
  ReportFilter,
} from "@/services/reports";
import { getClients } from "@/services/clients";
import { Client } from "@/services/clients";
import { useNotification } from "@/contexts/NotificationContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts";

interface ReportData {
  summary: {
    totalQuotations: number;
    totalApproved: number;
    totalRejected: number;
    totalPending: number;
    totalAmount: number;
    averageAmount: number;
  };
  quotationsByStatus: {
    status: string;
    count: number;
    amount: number;
  }[];
  quotationsByMonth: {
    month: string;
    count: number;
    amount: number;
  }[];
  quotationsByClient: {
    clientId: number;
    clientName: string;
    count: number;
    amount: number;
  }[];
  quotationItems: {
    productId: number;
    productName: string;
    count: number;
    amount: number;
  }[];
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
];

export default function ReportsPage() {
  const [startDate, setStartDate] = useState(
    new Date(new Date().setMonth(new Date().getMonth() - 6))
      .toISOString()
      .split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [clientId, setClientId] = useState<string>("");
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [activeChart, setActiveChart] = useState<string>("monthly");
  const { addNotification } = useNotification();

  // Cargar clientes al iniciar
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const clientsData = await getClients();
        setClients(clientsData);
      } catch (error) {
        console.error("Error loading clients:", error);
        addNotification("error", "Error al cargar los clientes");
      } finally {
        setIsLoading(false);
      }
    };

    fetchClients();
  }, []);

  // Cargar reporte inicial
  useEffect(() => {
    generateReport();
  }, []);

  const generateReport = async () => {
    if (!startDate || !endDate) {
      addNotification("error", "Debes seleccionar un rango de fechas válido");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      addNotification(
        "error",
        "La fecha de inicio debe ser anterior a la fecha final"
      );
      return;
    }

    const filter: ReportFilter = {
      startDate,
      endDate,
    };

    if (clientId) {
      filter.clientId = clientId;
    }

    try {
      setIsGenerating(true);
      const data = await generateCustomReport(filter);
      setReportData(data as unknown as ReportData);
      addNotification("success", "Reporte generado correctamente");
    } catch (error) {
      console.error("Error generating report:", error);
      addNotification("error", "Error al generar el reporte");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportPDF = async () => {
    if (!startDate || !endDate) {
      addNotification("error", "Debes seleccionar un rango de fechas válido");
      return;
    }

    const filter: ReportFilter = {
      startDate,
      endDate,
    };

    if (clientId) {
      filter.clientId = clientId;
    }

    try {
      setIsExporting("pdf");
      const blob = await downloadReportPDF(filter);

      // Crear un enlace para descargar el archivo
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reporte-${startDate}-${endDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      addNotification("success", "Reporte descargado correctamente");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      addNotification("error", "Error al exportar el reporte a PDF");
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportExcel = async () => {
    if (!startDate || !endDate) {
      addNotification("error", "Debes seleccionar un rango de fechas válido");
      return;
    }

    const filter: ReportFilter = {
      startDate,
      endDate,
    };

    if (clientId) {
      filter.clientId = clientId;
    }

    try {
      setIsExporting("excel");
      const blob = await downloadReportExcel(filter);

      // Crear un enlace para descargar el archivo
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reporte-${startDate}-${endDate}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      addNotification("success", "Reporte descargado correctamente");
    } catch (error) {
      console.error("Error exporting Excel:", error);
      addNotification("error", "Error al exportar el reporte a Excel");
    } finally {
      setIsExporting(null);
    }
  };

  const renderMonthlyChart = () => {
    if (
      !reportData ||
      !reportData.quotationsByMonth ||
      reportData.quotationsByMonth.length === 0
    ) {
      return (
        <div className="flex items-center justify-center h-60">
          <p className="text-content-subtle">
            No hay datos disponibles para el período seleccionado
          </p>
        </div>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={reportData.quotationsByMonth}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
          <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
          <Tooltip />
          <Legend />
          <Bar
            yAxisId="left"
            dataKey="count"
            name="Número de cotizaciones"
            fill="#8884d8"
          />
          <Bar
            yAxisId="right"
            dataKey="amount"
            name="Monto total ($)"
            fill="#82ca9d"
          />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderStatusChart = () => {
    if (
      !reportData ||
      !reportData.quotationsByStatus ||
      reportData.quotationsByStatus.length === 0
    ) {
      return (
        <div className="flex items-center justify-center h-60">
          <p className="text-content-subtle">
            No hay datos disponibles para el período seleccionado
          </p>
        </div>
      );
    }

    // Mapear nombres de estado para mostrar
    const data = reportData.quotationsByStatus.map((item) => ({
      ...item,
      statusName: getStatusName(item.status),
    }));

    return (
      <ResponsiveContainer width="100%" height={350}>
        <RechartsPieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="statusName"
            cx="50%"
            cy="50%"
            outerRadius={100}
            fill="#8884d8"
            label={(entry) => `${entry.statusName}: ${entry.count}`}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip formatter={(value, name) => [`${value}`, name]} />
          <Legend />
        </RechartsPieChart>
      </ResponsiveContainer>
    );
  };

  const renderClientChart = () => {
    if (
      !reportData ||
      !reportData.quotationsByClient ||
      reportData.quotationsByClient.length === 0
    ) {
      return (
        <div className="flex items-center justify-center h-60">
          <p className="text-content-subtle">
            No hay datos disponibles para el período seleccionado
          </p>
        </div>
      );
    }

    // Limitar a los top 5 clientes por monto
    const topClients = [...reportData.quotationsByClient]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return (
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={topClients} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis type="category" dataKey="clientName" width={150} />
          <Tooltip />
          <Legend />
          <Bar dataKey="amount" name="Monto total ($)" fill="#b42516" />
          <Bar dataKey="count" name="Número de cotizaciones" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderProductChart = () => {
    if (
      !reportData ||
      !reportData.quotationItems ||
      reportData.quotationItems.length === 0
    ) {
      return (
        <div className="flex items-center justify-center h-60">
          <p className="text-content-subtle">
            No hay datos disponibles para el período seleccionado
          </p>
        </div>
      );
    }

    // Limitar a los top 5 productos por monto
    const topProducts = [...reportData.quotationItems]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return (
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={topProducts}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="productName" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="amount" name="Monto total ($)" fill="#82ca9d" />
          <Bar dataKey="count" name="Cantidad vendida" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  // Función auxiliar para mapear estados a nombres legibles
  const getStatusName = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "Borrador";
      case "SENT":
        return "Enviada";
      case "APPROVED":
        return "Aprobada";
      case "REJECTED":
        return "Rechazada";
      default:
        return status;
    }
  };

  // Mostrar pantalla de carga mientras se cargan los datos iniciales
  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-content-emphasis">Reportes</h1>
          <p className="text-content-subtle mt-2">
            Analiza el rendimiento de tus cotizaciones y ventas
          </p>
        </div>

        <div className="h-[500px] w-full flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
          <p>Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-content-emphasis">Reportes</h1>
        <p className="text-content-subtle mt-2">
          Analiza el rendimiento de tus cotizaciones y ventas
        </p>
      </div>

      {/* Filtros */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="space-y-2 w-full md:w-auto">
            <label className="text-sm font-medium">Fecha inicio</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2 w-full md:w-auto">
            <label className="text-sm font-medium">Fecha fin</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="space-y-2 w-full md:w-auto">
            <label className="text-sm font-medium">Cliente</label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todos los clientes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">Todos los clientes</SelectItem>
                {clients.map((client) => (
                  <SelectItem
                    key={client.id}
                    value={client.id?.toString() || ""}
                  >
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={generateReport}
            disabled={isGenerating}
            className="w-full md:w-auto"
          >
            {isGenerating ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generando...
              </div>
            ) : (
              <>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Generar reporte
              </>
            )}
          </Button>
          <div className="flex gap-2 w-full md:w-auto">
            <Button
              variant="outline"
              onClick={handleExportPDF}
              disabled={isExporting !== null || !reportData || isGenerating}
              className="w-full md:w-auto"
            >
              {isExporting === "pdf" ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileText className="mr-2 h-4 w-4" />
              )}
              PDF
            </Button>
            <Button
              variant="outline"
              onClick={handleExportExcel}
              disabled={isExporting !== null || !reportData || isGenerating}
              className="w-full md:w-auto"
            >
              {isExporting === "excel" ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileSpreadsheet className="mr-2 h-4 w-4" />
              )}
              Excel
            </Button>
          </div>
        </div>
      </Card>

      {/* Mostrar spinner mientras se genera el reporte */}
      {isGenerating && (
        <div className="h-[400px] w-full flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
          <p>Generando reporte...</p>
        </div>
      )}

      {/* Resumen */}
      {!isGenerating && reportData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 flex flex-col items-center justify-center">
            <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-bold">
              {reportData.summary.totalQuotations}
            </h3>
            <p className="text-content-subtle">Cotizaciones totales</p>
          </Card>
          <Card className="p-6 flex flex-col items-center justify-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-bold">
              {reportData.summary.totalApproved}
            </h3>
            <p className="text-content-subtle">Cotizaciones aprobadas</p>
          </Card>
          <Card className="p-6 flex flex-col items-center justify-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <DollarSignIcon className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold">
              ${reportData.summary.totalAmount.toLocaleString("es-CL")}
            </h3>
            <p className="text-content-subtle">Monto total</p>
          </Card>
        </div>
      )}

      {/* Gráficos */}
      {!isGenerating && reportData && (
        <Card className="p-6">
          <div className="flex flex-col space-y-6">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={activeChart === "monthly" ? "default" : "outline"}
                onClick={() => setActiveChart("monthly")}
                size="sm"
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Por mes
              </Button>
              <Button
                variant={activeChart === "status" ? "default" : "outline"}
                onClick={() => setActiveChart("status")}
                size="sm"
              >
                <PieChart className="mr-2 h-4 w-4" />
                Por estado
              </Button>
              <Button
                variant={activeChart === "client" ? "default" : "outline"}
                onClick={() => setActiveChart("client")}
                size="sm"
              >
                <Users className="mr-2 h-4 w-4" />
                Por cliente
              </Button>
              <Button
                variant={activeChart === "product" ? "default" : "outline"}
                onClick={() => setActiveChart("product")}
                size="sm"
              >
                <Package className="mr-2 h-4 w-4" />
                Por producto
              </Button>
            </div>

            <div className="h-[400px] w-full">
              {activeChart === "monthly" && renderMonthlyChart()}
              {activeChart === "status" && renderStatusChart()}
              {activeChart === "client" && renderClientChart()}
              {activeChart === "product" && renderProductChart()}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function CheckCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function DollarSignIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" x2="12" y1="2" y2="22" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function Package(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m7.5 4.27 9 5.15" />
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}
