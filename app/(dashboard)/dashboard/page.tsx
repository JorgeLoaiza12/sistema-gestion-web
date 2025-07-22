// app\(dashboard)\dashboard\page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import {
  Loader2,
  CalendarClock,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  DollarSign,
  FileText,
  BarChart2,
  Package as PackageIcon,
  RefreshCcw,
  PieChart as PieChartIcon,
  BarChartHorizontal,
  Wrench,
  FileSpreadsheet,
  Building,
} from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/utils/date-format";
import { formatCurrency } from "@/utils/number-format";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  getAdminDashboardData,
  getTechnicianDashboardData,
  downloadDashboardExcel,
} from "@/services/reports";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { StatsCard } from "@/components/dashboard/stats-card";
import { useNotification } from "@/contexts/NotificationContext";
import { Task } from "@/services/tasks";

const COLORS = [
  "#b42516", // Rojo
  "#2563eb", // Azul
  "#16a34a", // Verde
  "#eab308", // Amarillo
  "#8b5cf6", // Púrpura
  "#ec4899", // Rosa
  "#f97316", // Naranja
  "#14b8a6", // Turquesa
  "#64748b", // Gris azulado
  "#a855f7", // Violeta
  "#db2777", // Rojo frambuesa
  "#d946b6", // Magenta
  "#c026d3", // Púrpura oscuro
  "#be185d", // Rojo oscuro
  "#9f1239", // Granate
  "#881337", // Rojo borgoña
  "#4c0519", // Rojo muy oscuro
  "#d4d4d4", // Gris claro
  "#a3a3a3", // Gris medio
  "#737373", // Gris oscuro
];

function CustomBadge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
    >
      {children}
    </span>
  );
}

export default function DashboardPage() {
  const { data: session, status: sessionStatus } = useSession();
  const { addNotification } = useNotification();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    end: new Date(),
  });
  const [adminData, setAdminData] = useState<any>(null);
  const [technicianData, setTechnicianData] = useState<any>(null);

  const isAdmin = session?.user?.role === "ADMIN";
  const today = new Date();
  const formattedDate = formatDate(today, "EEEE, dd 'de' MMMM");

  const fetchData = useCallback(async () => {
    if (sessionStatus !== "authenticated") return;
    setIsLoading(true);

    try {
      if (isAdmin) {
        const startDate = formatDate(dateRange.start, "yyyy-MM-dd");
        const endDate = formatDate(dateRange.end, "yyyy-MM-dd");
        const data = await getAdminDashboardData(startDate, endDate);
        setAdminData(data);
      } else {
        const data = await getTechnicianDashboardData();
        setTechnicianData(data);
      }
    } catch (error) {
      console.error("Error al cargar datos del dashboard:", error);
      addNotification("error", "Error al cargar los datos del dashboard");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [sessionStatus, isAdmin, dateRange, addNotification]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  const handleDateRangeChange = (range: { start?: Date; end?: Date }) => {
    if (range.start && range.end) {
      setDateRange({
        start: new Date(range.start),
        end: new Date(range.end),
      });
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const startDate = formatDate(dateRange.start, "yyyy-MM-dd");
      const endDate = formatDate(dateRange.end, "yyyy-MM-dd");
      const blob = await downloadDashboardExcel(startDate, endDate);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Reporte_Dashboard_${startDate}_a_${endDate}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      addNotification(
        "success",
        "Reporte de dashboard exportado correctamente"
      );
    } catch (error) {
      console.error("Error exporting dashboard to Excel:", error);
      addNotification("error", "No se pudo exportar el reporte del dashboard");
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading && !adminData && !technicianData) {
    return (
      <div className="flex flex-col justify-center items-center h-96">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-content-subtle">
          Cargando panel de control...
        </p>
      </div>
    );
  }

  if (isAdmin) {
    const quotationStats = adminData?.quotationStats;
    const taskStats = adminData?.taskStats;
    const topProducts = adminData?.topProducts;
    const upcomingMaintenances = adminData?.upcomingMaintenances;
    const maintenanceFailuresByBuilding =
      adminData?.maintenanceFailuresByBuilding;
    const buildingNamesForChart = adminData?.buildingNamesForChart;
    const maintenanceCategoriesByClient =
      adminData?.maintenanceCategoriesByClient;

    const hasSalesData = quotationStats?.monthlySales?.length > 0;
    const hasQuotationStats = quotationStats?.summary?.totalCount > 0;
    const hasTopProducts = topProducts?.length > 0;
    const hasMaintenances = upcomingMaintenances?.length > 0;
    const hasMaintenanceCategoriesByClient =
      maintenanceCategoriesByClient?.data?.length > 0;

    const quotationByStatusData = hasQuotationStats
      ? quotationStats.byStatus?.map((item: any) => ({
          name: getStatusLabel(item.status),
          value: item.count,
          amount: item.amount || 0,
        })) || []
      : [];

    const RADIAN = Math.PI / 180;
    const renderCustomizedLabel = ({
      cx,
      cy,
      midAngle,
      innerRadius,
      outerRadius,
      value,
    }: any) => {
      const radius = innerRadius + (outerRadius - innerRadius) * 0.7;
      const x = cx + radius * Math.cos(-midAngle * RADIAN);
      const y = cy + radius * Math.sin(-midAngle * RADIAN);
      if (value === 0) return null;
      return (
        <text
          x={x}
          y={y}
          fill="white"
          textAnchor={x > cx ? "start" : "end"}
          dominantBaseline="central"
          fontSize="12"
        >
          {value}
        </text>
      );
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-content-emphasis">
              Dashboard
            </h1>
            <p className="text-sm text-content-subtle">
              {dateRange.start && formatDate(dateRange.start, "dd MMM yyyy")} -{" "}
              {dateRange.end && formatDate(dateRange.end, "dd MMM yyyy")}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <DateRangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
              className="w-full sm:w-auto"
            />
            <Button
              variant="outline"
              size="icon"
              className="hidden sm:flex"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleExportExcel}
              disabled={isExporting || isRefreshing}
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <FileSpreadsheet className="h-4 w-4 mr-2" />
              )}
              Exportar Excel
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Cotizaciones"
            value={quotationStats?.summary?.totalCount?.toString() || "0"}
            change={`${
              quotationStats?.summary?.percentChange?.toFixed(1) || 0
            }%`}
            trend={quotationStats?.summary?.percentChange >= 0 ? "up" : "down"}
            icon={FileText}
          />
          <StatsCard
            title="Ventas totales"
            value={formatCurrency(quotationStats?.summary?.totalAmount || 0)}
            change={`${
              quotationStats?.summary?.amountPercentChange?.toFixed(1) || 0
            }%`}
            trend={
              quotationStats?.summary?.amountPercentChange >= 0 ? "up" : "down"
            }
            icon={DollarSign}
          />
          <StatsCard
            title="Tareas asignadas"
            value={quotationStats?.summary?.tasksCount?.toString() || "0"}
            change={`${
              quotationStats?.summary?.tasksPercentChange?.toFixed(1) || 0
            }%`}
            trend={
              quotationStats?.summary?.tasksPercentChange >= 0 ? "up" : "down"
            }
            icon={CalendarClock}
          />
          <StatsCard
            title="Tasa de aprobación"
            value={`${(quotationStats?.summary?.approvalRate || 0).toFixed(
              1
            )}%`}
            change={`0%`}
            trend={"up"}
            icon={TrendingUp}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-6">Resumen de ventas</h3>
            <div className="h-80">
              {hasSalesData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={quotationStats.monthlySales}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis
                      yAxisId="left"
                      orientation="left"
                      stroke="#b42516"
                      tickFormatter={(value) => formatCurrency(value, 0)}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#2563eb"
                    />
                    <Tooltip
                      formatter={(value, name) =>
                        name === "Monto ($)" ? formatCurrency(value) : value
                      }
                    />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="total"
                      name="Monto ($)"
                      fill="#b42516"
                      barSize={20}
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="count"
                      name="Cantidad"
                      fill="#2563eb"
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <BarChart2 className="h-12 w-12 text-content-subtle mb-2 opacity-50" />
                  <p className="text-content-subtle">
                    No hay datos de ventas para el período seleccionado.
                  </p>
                </div>
              )}
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-6">
              Cotizaciones por estado
            </h3>
            <div className="h-80">
              {quotationByStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={quotationByStatusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={renderCustomizedLabel}
                      labelLine={false}
                    >
                      {quotationByStatusData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name, props) => [
                        `${value} cotizaciones (${formatCurrency(
                          props.payload.payload.amount
                        )})`,
                        name,
                      ]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <PieChartIcon className="h-12 w-12 text-content-subtle mb-2 opacity-50" />
                  <p className="text-content-subtle">
                    No hay datos de cotizaciones para el período seleccionado.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center">
              <Wrench className="h-5 w-5 mr-2 text-primary" />
              Tareas por Tipo de Servicio
            </h3>
            <div className="h-80">
              {taskStats?.byType?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={taskStats.byType}
                    layout="vertical"
                    margin={{ left: 20, right: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={80}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="count"
                      name="N° de Tareas"
                      fill="#16a34a"
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Wrench className="h-12 w-12 text-content-subtle mb-2 opacity-50" />
                  <p className="text-content-subtle">No hay datos de tareas.</p>
                </div>
              )}
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center">
              <BarChartHorizontal className="h-5 w-5 mr-2 text-primary" />
              Tareas por Categoría
            </h3>
            <div className="h-80">
              {taskStats?.byCategory?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={taskStats.byCategory}
                    layout="vertical"
                    margin={{ left: 20, right: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={100}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip />
                    <Bar
                      dataKey="count"
                      name="N° de Tareas"
                      fill="#f97316"
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <BarChartHorizontal className="h-12 w-12 text-content-subtle mb-2 opacity-50" />
                  <p className="text-content-subtle">
                    No hay datos de tareas por categoría.
                  </p>
                </div>
              )}
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center">
              <Wrench className="h-5 w-5 mr-2 text-primary" />
              Fallas en Mantenimientos por Edificio
            </h3>
            <div className="h-80">
              {maintenanceFailuresByBuilding?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={maintenanceFailuresByBuilding}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" tick={{ fontSize: 10 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    {buildingNamesForChart?.map((buildingName, index) => (
                      <Bar
                        key={buildingName}
                        dataKey={buildingName}
                        stackId="a"
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Wrench className="h-12 w-12 text-content-subtle mb-2 opacity-50" />
                  <p className="text-content-subtle">
                    No hay datos de fallas en mantenimientos para el período
                    seleccionado.
                  </p>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center">
              <Building className="h-5 w-5 mr-2 text-primary" />
              Total de Fallas por Edificio con Mantención
            </h3>
            <div className="h-80">
              {hasMaintenanceCategoriesByClient ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={maintenanceCategoriesByClient.data
                      .slice()
                      .sort((a, b) => b.value - a.value)}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      interval={0}
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="value"
                      name="N° Total de Fallas"
                      fill="#b42516"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Building className="h-12 w-12 text-content-subtle mb-2 opacity-50" />
                  <p className="text-content-subtle">
                    No hay datos de fallas en mantenimientos para edificios con
                    servicio de mantención.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center">
              <PieChartIcon className="h-5 w-5 mr-2 text-primary" /> Tareas
              Finalizadas por Técnico
            </h3>
            <div className="h-96">
              {taskStats?.byTechnician?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={taskStats.byTechnician}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      label
                    >
                      {taskStats.byTechnician.map((entry, index) => (
                        <Cell
                          key={`cell-tech-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <PieChartIcon className="h-12 w-12 text-content-subtle mb-2 opacity-50" />
                  <p className="text-content-subtle">
                    No hay tareas finalizadas en el período.
                  </p>
                </div>
              )}
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="overflow-hidden">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold flex items-center">
                  <PackageIcon className="h-5 w-5 mr-2 text-primary" />
                  Productos más vendidos
                </h3>
              </div>
              <div className="p-0">
                {hasTopProducts ? (
                  <div className="divide-y">
                    {topProducts.map((product, index) => (
                      <div
                        key={index}
                        className="p-4 hover:bg-accent/5 flex justify-between items-center"
                      >
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center mr-3">
                            <span className="font-semibold text-sm">
                              {index + 1}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-medium">{product.name}</h4>
                            <p className="text-sm text-content-subtle">
                              {product.cantidad} unidades
                            </p>
                          </div>
                        </div>
                        <span className="font-semibold">
                          {formatCurrency(product.valor)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <PackageIcon className="h-12 w-12 text-content-subtle mb-4 opacity-50" />
                    <h3 className="text-lg font-medium">
                      Sin datos de productos
                    </h3>
                    <p className="text-content-subtle mt-2">
                      No hay información de ventas de productos en el período
                      seleccionado.
                    </p>
                  </div>
                )}
              </div>
              <div className="p-4 border-t bg-accent/5">
                <Link href="/dashboard/products">
                  <Button variant="outline" className="w-full">
                    Ver todos los productos
                  </Button>
                </Link>
              </div>
            </Card>
            <Card className="overflow-hidden">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-primary" />
                  Mantenimientos próximos
                </h3>
              </div>
              <div className="p-0">
                {hasMaintenances ? (
                  <div className="divide-y">
                    {upcomingMaintenances.map((maintenance) => (
                      <div
                        key={maintenance.id}
                        className="p-4 hover:bg-accent/5"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">
                              {maintenance.client
                                ? maintenance.client.name
                                : "Cliente sin asignar"}
                            </h4>
                            <p className="text-sm text-content-subtle mt-1">
                              Próximo:{" "}
                              {formatDate(
                                new Date(maintenance.nextMaintenanceDate),
                                "dd MMM yyyy"
                              )}
                            </p>
                          </div>
                          <CustomBadge
                            className={getMaintenanceStatusClass(
                              maintenance.nextMaintenanceDate
                            )}
                          >
                            {getMaintenanceStatusLabel(
                              maintenance.nextMaintenanceDate
                            )}
                          </CustomBadge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <Calendar className="h-12 w-12 text-content-subtle mb-4 opacity-50" />
                    <h3 className="text-lg font-medium">
                      Sin mantenimientos próximos
                    </h3>
                    <p className="text-content-subtle mt-2">
                      No hay mantenimientos programados para los próximos 30
                      días.
                    </p>
                  </div>
                )}
              </div>
              <div className="p-4 border-t bg-accent/5">
                <Link href="/dashboard/maintenance">
                  <Button variant="outline" className="w-full">
                    Ver todos los mantenimientos
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Vista del Técnico
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-content-emphasis">
          Hola, {session?.user?.name?.split(" ")[0] || "Técnico"}
        </h1>
        <p className="text-content-subtle mt-1">{formattedDate}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <span className="font-medium text-content-subtle">Tareas Hoy</span>
          </div>
          <span className="text-3xl font-bold mt-2">
            {technicianData?.tasksToday || 0}
          </span>
          <Link
            href="/dashboard/agenda"
            className="text-primary text-sm mt-auto font-medium flex items-center"
          >
            Ver agenda <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </Card>
        <Card className="p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <CalendarClock className="h-5 w-5 text-green-600" />
            </div>
            <span className="font-medium text-content-subtle">Esta semana</span>
          </div>
          <span className="text-3xl font-bold mt-2">
            {technicianData?.tasksThisWeek || 0}
          </span>
        </Card>
        <Card className="p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <span className="font-medium text-content-subtle">Vencidas</span>
          </div>
          <span className="text-3xl font-bold mt-2">
            {technicianData?.overdueItems || 0}
          </span>
        </Card>
        <Card className="p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-purple-600" />
            </div>
            <span className="font-medium text-content-subtle">Completadas</span>
          </div>
          <span className="text-3xl font-bold mt-2">
            {technicianData?.tasksCompleted || 0}
          </span>
          <span className="text-xs text-content-subtle mt-1">
            En la semana actual
          </span>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold flex items-center">
            <CalendarClock className="mr-2 h-5 w-5 text-primary" />
            Tareas para esta semana
          </h2>
        </div>
        <div className="p-0">
          {technicianData?.weeklyTasks?.length > 0 ? (
            <div className="md:hidden">
              {[
                "Lunes",
                "Martes",
                "Miércoles",
                "Jueves",
                "Viernes",
                "Sábado",
                "Domingo",
              ].map((day, idx) => {
                const tasksForDay = technicianData.weeklyTasks.filter(
                  (task: Task) =>
                    (new Date(task.startDate).getDay() + 6) % 7 === idx
                );
                if (tasksForDay.length === 0) return null;
                const isToday = (new Date().getDay() + 6) % 7 === idx;
                return (
                  <div
                    key={idx}
                    className={`p-3 ${isToday ? "bg-accent/10" : ""}`}
                  >
                    <h4
                      className={`font-medium text-sm mb-2 ${
                        isToday
                          ? "text-primary font-semibold"
                          : "text-content-subtle"
                      }`}
                    >
                      {day}
                      {isToday && (
                        <span className="text-xs ml-1 bg-primary text-white px-1.5 py-0.5 rounded-full">
                          Hoy
                        </span>
                      )}
                    </h4>
                    <div className="space-y-2">
                      {tasksForDay.map((task: Task) => (
                        <div key={task.id} className="bg-accent/5 p-3 rounded">
                          <p className="font-medium">{task.title}</p>
                          <p className="text-xs text-content-subtle mt-1">
                            {formatDate(new Date(task.startDate), "HH:mm")}
                            {task.client && `- ${task.client.name}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-medium">
                ¡Semana sin tareas pendientes!
              </h3>
              <p className="text-content-subtle mt-2">
                No tienes tareas asignadas para esta semana.
              </p>
            </div>
          )}
        </div>
        <div className="p-4 border-t bg-accent/5">
          <Link href="/dashboard/agenda">
            <Button variant="outline" className="w-full">
              Ver agenda completa
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

function getMaintenanceStatusClass(nextDate: string): string {
  const now = new Date();
  const nextMaintenanceDate = new Date(nextDate);
  const diffTime = nextMaintenanceDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "bg-red-100 text-red-800";
  if (diffDays <= 7) return "bg-amber-100 text-amber-800";
  if (diffDays <= 30) return "bg-blue-100 text-blue-800";
  return "bg-green-100 text-green-800";
}

function getMaintenanceStatusLabel(nextDate: string): string {
  const now = new Date();
  const nextMaintenanceDate = new Date(nextDate);
  const diffTime = nextMaintenanceDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "Vencido";
  if (diffDays <= 7) return "Urgente";
  if (diffDays <= 30) return "Próximo";
  return "Programado";
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "SENT":
      return "Enviada";
    case "APPROVED":
      return "Aprobada";
    case "REJECTED":
      return "Rechazada";
    default:
      return status;
  }
}
