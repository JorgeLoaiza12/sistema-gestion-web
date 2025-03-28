"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import {
  Loader2,
  CalendarClock,
  Calendar,
  Clock,
  Users,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  DollarSign,
  FileText,
  BarChart2,
  Package as PackageIcon,
  UserCircle,
  RefreshCcw,
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

// Importación de los servicios necesarios
import { getTasksByDate, type Task } from "@/services/tasks";
import { getQuotationStats } from "@/services/quotations";
import { getSalesStats, getTopProducts } from "@/services/reports";
import { getUpcomingMaintenances } from "@/services/maintenance";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { StatsCard } from "@/components/dashboard/stats-card";
import { useNotification } from "@/contexts/NotificationContext";

// Colores para gráficos
const COLORS = [
  "#b42516",
  "#2563eb",
  "#16a34a",
  "#eab308",
  "#8b5cf6",
  "#ec4899",
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const { addNotification } = useNotification();
  const [isLoading, setIsLoading] = useState(true);
  const isInitialMount = useRef(true);

  // Estados para la vista de técnicos
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [overdueItems, setOverdueItems] = useState(0);
  const [tasksToday, setTasksToday] = useState(0);
  const [tasksThisWeek, setTasksThisWeek] = useState(0);
  const [tasksCompleted, setTasksCompleted] = useState(0);

  // Estados para la vista de administradores
  const monthStart = new Date();
  monthStart.setDate(1); // Primer día del mes actual
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    end: new Date(),
  });
  const [salesData, setSalesData] = useState<any[]>([]);
  const [quotationStats, setQuotationStats] = useState<any>(null);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [upcomingMaintenances, setUpcomingMaintenances] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  // Verificar si el usuario es admin
  const isAdmin = session?.user?.role === "ADMIN";

  // Obtener la fecha actual para mostrar
  const today = new Date();
  const formattedDate = formatDate(today, "EEEE, dd 'de' MMMM yyyy");

  // Cargar datos para dashboard de técnicos
  useEffect(() => {
    if (!isAdmin && session) {
      fetchTechnicianData();
    }
  }, [isAdmin, session]);

  // Cargar datos iniciales para dashboard de administradores
  useEffect(() => {
    if (isAdmin && session && !initialDataLoaded) {
      fetchAdminData();
      fetchUpcomingMaintenances();
      setInitialDataLoaded(true);
    }
  }, [isAdmin, session, initialDataLoaded]);

  // Efecto para manejar cambios en el dateRange
  useEffect(() => {
    if (isAdmin && initialDataLoaded && !isInitialMount.current) {
      setIsLoading(true);
      fetchAdminData();
    }

    if (isInitialMount.current) {
      isInitialMount.current = false;
    }
  }, [dateRange, isAdmin, initialDataLoaded]);

  // Función para manejar cambios en el rango de fechas
  const handleDateRangeChange = (range: { start: Date; end: Date }) => {
    // Solo actualizar el estado si ambas fechas están presentes
    if (range.start && range.end) {
      // Crear un nuevo objeto de rango para asegurar que se actualiza el estado
      const newDateRange = {
        start: new Date(range.start),
        end: new Date(range.end),
      };

      // Actualizar el estado
      setDateRange(newDateRange);
    }
  };

  // Funciones para cargar datos del dashboard de administradores
  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchSalesData(),
        fetchQuotationStats(),
        fetchTopProducts(),
      ]);
    } catch (error) {
      console.error("Error al cargar datos del dashboard admin:", error);
      addNotification("error", "Error al cargar datos del dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAdminData = async () => {
    setIsRefreshing(true);
    try {
      // Resetear los datos para evitar mostrar datos antiguos mientras se cargan los nuevos
      setSalesData([]);
      setQuotationStats(null);
      setTopProducts([]);

      await Promise.all([
        fetchSalesData(),
        fetchQuotationStats(),
        fetchTopProducts(),
        fetchUpcomingMaintenances(),
      ]);
      addNotification("success", "Datos actualizados correctamente");
    } catch (error) {
      console.error("Error al actualizar datos:", error);
      addNotification("error", "Error al actualizar datos");
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchSalesData = async () => {
    try {
      if (!dateRange.start || !dateRange.end) return;

      const startDate = formatDate(dateRange.start, "yyyy-MM-dd");
      const endDate = formatDate(dateRange.end, "yyyy-MM-dd");

      const data = await getSalesStats("month", startDate, endDate);

      if (data && data.monthlySales && data.monthlySales.length > 0) {
        // Transformar los datos para el gráfico
        const formattedData = data.monthlySales.map((item) => ({
          mes: item.month,
          valor: item.total || 0,
          cantidad: item.count || 0,
        }));

        setSalesData(formattedData);
      } else {
        // Si no hay datos, establecer un array vacío
        setSalesData([]);
      }
    } catch (error) {
      console.error("Error al cargar datos de ventas:", error);
      // Establecer un array vacío para que la UI no se rompa
      setSalesData([]);
    }
  };

  const fetchQuotationStats = async () => {
    try {
      if (!dateRange.start || !dateRange.end) return;

      const startDate = formatDate(dateRange.start, "yyyy-MM-dd");
      const endDate = formatDate(dateRange.end, "yyyy-MM-dd");

      const stats = await getQuotationStats({
        startDate,
        endDate,
      });

      if (stats && stats.summary) {
        setQuotationStats(stats);
      } else {
        // Proporcionar datos vacíos si no se recibe respuesta
        setQuotationStats({
          summary: {
            totalCount: 0,
            previousCount: 0,
            percentChange: 0,
            totalAmount: 0,
            previousAmount: 0,
            amountPercentChange: 0,
            tasksCount: 0,
            previousTasksCount: 0,
            tasksPercentChange: 0,
            approvalRate: 0,
            previousApprovalRate: 0,
            approvalRateChange: 0,
          },
          byStatus: [],
        });
      }
    } catch (error) {
      console.error("Error al cargar estadísticas de cotizaciones:", error);
      // Proporcionar datos vacíos si hay un error
      setQuotationStats({
        summary: {
          totalCount: 0,
          previousCount: 0,
          percentChange: 0,
          totalAmount: 0,
          previousAmount: 0,
          amountPercentChange: 0,
          tasksCount: 0,
          previousTasksCount: 0,
          tasksPercentChange: 0,
          approvalRate: 0,
          previousApprovalRate: 0,
          approvalRateChange: 0,
        },
        byStatus: [],
      });
    }
  };

  const fetchTopProducts = async () => {
    try {
      if (!dateRange.start || !dateRange.end) return;

      const startDate = formatDate(dateRange.start, "yyyy-MM-dd");
      const endDate = formatDate(dateRange.end, "yyyy-MM-dd");

      const data = await getTopProducts(5, startDate, endDate);

      if (data && Array.isArray(data) && data.length > 0) {
        setTopProducts(data);
      } else {
        setTopProducts([]);
      }
    } catch (error) {
      console.error("Error al cargar productos más vendidos:", error);
      setTopProducts([]);
    }
  };

  const fetchUpcomingMaintenances = async () => {
    try {
      const data = await getUpcomingMaintenances(30);

      if (data && Array.isArray(data) && data.length > 0) {
        setUpcomingMaintenances(data.slice(0, 5));
      } else {
        setUpcomingMaintenances([]);
      }
    } catch (error) {
      console.error("Error al cargar mantenimientos próximos:", error);
      setUpcomingMaintenances([]);
    }
  };

  // Función para cargar datos del dashboard de técnicos
  const fetchTechnicianData = async () => {
    setIsLoading(true);
    try {
      // Obtener tareas de hoy
      const todayResponse = await getTasksByDate({
        date: new Date().toISOString().split("T")[0],
        view: "daily",
      });

      // Obtener tareas de la semana
      const weekResponse = await getTasksByDate({
        date: new Date().toISOString().split("T")[0],
        view: "weekly",
      });

      if (todayResponse?.tasks) {
        // Tareas para hoy
        const todayTasksFiltered = todayResponse.tasks.filter(
          (task) => task.state !== "FINALIZADO"
        );
        setTasksToday(todayTasksFiltered.length);

        // Tareas pendientes (próximas para mostrar)
        const pendingTasks = todayResponse.tasks
          .filter((task) => task.state === "PENDIENTE")
          .slice(0, 3);
        setUpcomingTasks(pendingTasks);
      }

      if (weekResponse?.tasks) {
        // Tareas de la semana
        setTasksThisWeek(
          weekResponse.tasks.filter((task) => task.state !== "FINALIZADO")
            .length
        );

        // Tareas vencidas
        const overdue = weekResponse.tasks.filter((task) => {
          const taskDate = new Date(task.startDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return task.state !== "FINALIZADO" && taskDate < today;
        });
        setOverdueItems(overdue.length);

        // Tareas completadas esta semana
        const completed = weekResponse.tasks.filter(
          (task) => task.state === "FINALIZADO"
        );
        setTasksCompleted(completed.length);
      }
    } catch (error) {
      console.error("Error al cargar tareas:", error);
      addNotification("error", "Error al cargar tareas");
    } finally {
      setIsLoading(false);
    }
  };

  // Componentes de carga
  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-96">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-content-subtle">
          Cargando panel de control...
        </p>
      </div>
    );
  }

  // Dashboard para administradores
  if (isAdmin) {
    // Verificar si hay datos para mostrar
    const hasQuotationStats = quotationStats?.summary?.totalCount > 0;
    const hasSalesData = salesData.length > 0;
    const hasTopProducts = topProducts.length > 0;
    const hasMaintenances = upcomingMaintenances.length > 0;

    // Preparar datos para gráficos solo si hay datos
    const quotationByStatusData = hasQuotationStats
      ? quotationStats?.byStatus?.map((item) => ({
          name: getStatusLabel(item.status),
          value: item.count,
          amount: item.amount,
        })) || []
      : [];

    const topProductsData = hasTopProducts
      ? topProducts.map((product) => ({
          name: product.name,
          valor: product.totalSales || 0,
          cantidad: product.count || 0,
        }))
      : [];

    return (
      <div className="space-y-6">
        {/* Cabecera con título y filtros */}
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
              onClick={refreshAdminData}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Tarjetas de resumen */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Cotizaciones"
            value={quotationStats?.summary?.totalCount?.toString() || "0"}
            change={
              quotationStats?.summary?.percentChange
                ? `${quotationStats.summary.percentChange.toFixed(1)}%`
                : undefined
            }
            trend={quotationStats?.summary?.percentChange >= 0 ? "up" : "down"}
            icon={FileText}
          />
          <StatsCard
            title="Ventas totales"
            value={formatCurrency(quotationStats?.summary?.totalAmount || 0)}
            change={
              quotationStats?.summary?.amountPercentChange
                ? `${quotationStats.summary.amountPercentChange.toFixed(1)}%`
                : undefined
            }
            trend={
              quotationStats?.summary?.amountPercentChange >= 0 ? "up" : "down"
            }
            icon={DollarSign}
          />
          <StatsCard
            title="Tareas asignadas"
            value={quotationStats?.summary?.tasksCount?.toString() || "0"}
            change={
              quotationStats?.summary?.tasksPercentChange
                ? `${quotationStats.summary.tasksPercentChange.toFixed(1)}%`
                : undefined
            }
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
            change={
              quotationStats?.summary?.approvalRateChange
                ? `${quotationStats.summary.approvalRateChange.toFixed(1)}%`
                : undefined
            }
            trend={
              quotationStats?.summary?.approvalRateChange >= 0 ? "up" : "down"
            }
            icon={TrendingUp}
          />
        </div>

        {/* Gráficos principales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de ventas */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Resumen de ventas</h3>
            </div>
            <div className="h-80">
              {hasSalesData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis yAxisId="left" orientation="left" stroke="#b42516" />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#2563eb"
                    />
                    <Tooltip
                      formatter={(value) =>
                        typeof value === "number"
                          ? value.toLocaleString("es-CL")
                          : value
                      }
                    />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="valor"
                      name="Monto ($)"
                      fill="#b42516"
                      barSize={20}
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="cantidad"
                      name="Cantidad"
                      fill="#2563eb"
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <BarChart2 className="h-12 w-12 text-content-subtle mb-2 opacity-50" />
                  <p className="text-content-subtle">
                    No hay datos de ventas disponibles
                  </p>
                  <p className="text-content-subtle text-sm mt-1">
                    No existen ventas en el período seleccionado
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Gráfico de cotizaciones por estado */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Cotizaciones por estado</h3>
            </div>
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
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {quotationByStatusData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name, props) => [value, name]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <PieChart className="h-12 w-12 text-content-subtle mb-2 opacity-50" />
                  <p className="text-content-subtle">
                    No hay datos de cotizaciones disponibles
                  </p>
                  <p className="text-content-subtle text-sm mt-1">
                    No existen cotizaciones en el período seleccionado
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Secciones secundarias */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Productos más vendidos */}
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
                  {topProductsData.map((product, index) => (
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
                            {product.cantidad} unidades vendidas
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
                    seleccionado
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

          {/* Mantenimientos próximos */}
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
                    <div key={maintenance.id} className="p-4 hover:bg-accent/5">
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
                        <Badge
                          className={getMaintenanceStatusClass(
                            maintenance.nextMaintenanceDate
                          )}
                        >
                          {getMaintenanceStatusLabel(
                            maintenance.nextMaintenanceDate
                          )}
                        </Badge>
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
                    No hay mantenimientos programados para los próximos 30 días
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
    );
  }

  // Dashboard para trabajadores
  return (
    <div className="space-y-8">
      {/* Cabecera con saludo y fecha */}
      <div>
        <h1 className="text-3xl font-bold text-content-emphasis">
          Hola, {session?.user?.name?.split(" ")[0] || "Técnico"}
        </h1>
        <p className="text-content-subtle mt-1">{formattedDate}</p>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <span className="font-medium text-content-subtle">Tareas Hoy</span>
          </div>
          <span className="text-3xl font-bold mt-2">{tasksToday}</span>
          <Link
            href="/dashboard/agenda"
            className="text-primary text-sm mt-auto font-medium flex items-center"
          >
            Ver historial <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </Card>
      </div>

      {/* Próximas tareas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="col-span-1">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold flex items-center">
              <CalendarClock className="mr-2 h-5 w-5 text-primary" />
              Próximas Tareas
            </h2>
          </div>
          <div className="p-0">
            {upcomingTasks.length > 0 ? (
              <div className="divide-y">
                {upcomingTasks.map((task) => (
                  <div key={task.id} className="p-4 hover:bg-accent/5">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{task.title}</h3>
                        <p className="text-sm text-content-subtle mt-1">
                          {formatDate(new Date(task.startDate), "HH:mm")} -
                          {task.client && ` ${task.client.name}`}
                        </p>
                      </div>
                      <Link href={`/dashboard/agenda?taskId=${task.id}`}>
                        <Button size="sm" variant="outline">
                          Ver detalles
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-lg font-medium">¡Todo al día!</h3>
                <p className="text-content-subtle mt-2">
                  No tienes tareas pendientes para hoy
                </p>
              </div>
            )}
          </div>
          <div className="p-4 border-t bg-accent/5">
            <Link href="/dashboard/agenda">
              <Button variant="outline" className="w-full">
                Ver toda la agenda
              </Button>
            </Link>
          </div>
        </Card>

        {/* Enlaces rápidos y recursos */}
        <Card className="col-span-1">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Enlaces rápidos</h2>
          </div>
          <div className="p-4 space-y-2">
            <Link href="/dashboard/customers" className="block">
              <div className="p-4 border rounded-lg hover:border-primary hover:bg-accent/5 transition-colors">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Clientes</h3>
                      <p className="text-sm text-content-subtle">
                        Consulta información de clientes
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-content-subtle" />
                </div>
              </div>
            </Link>

            <Link href="/dashboard/products" className="block">
              <div className="p-4 border rounded-lg hover:border-primary hover:bg-accent/5 transition-colors">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                      <PackageIcon className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Productos</h3>
                      <p className="text-sm text-content-subtle">
                        Catálogo de productos
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-content-subtle" />
                </div>
              </div>
            </Link>

            <Link href="/dashboard/profile" className="block">
              <div className="p-4 border rounded-lg hover:border-primary hover:bg-accent/5 transition-colors">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                      <UserCircle className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Mi Perfil</h3>
                      <p className="text-sm text-content-subtle">
                        Actualiza tus datos personales
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-content-subtle" />
                </div>
              </div>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

// Componente Badge
function Badge({
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

// Función para obtener la clase de estilo para el estado de mantenimiento
function getMaintenanceStatusClass(nextDate: string): string {
  const now = new Date();
  const nextMaintenanceDate = new Date(nextDate);
  const diffTime = nextMaintenanceDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "bg-red-100 text-red-800"; // Vencido
  if (diffDays <= 7) return "bg-amber-100 text-amber-800"; // Urgente (próximos 7 días)
  if (diffDays <= 30) return "bg-blue-100 text-blue-800"; // Próximo (próximos 30 días)
  return "bg-green-100 text-green-800"; // Programado (más de 30 días)
}

// Función para obtener la etiqueta para el estado de mantenimiento
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

// Función para traducir los estados de cotización
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
