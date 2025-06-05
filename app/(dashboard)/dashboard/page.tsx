// web/app/(dashboard)/dashboard/page.tsx
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
import { getWorkerTasks, type Task } from "@/services/tasks";
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
  const [weeklyTasks, setWeeklyTasks] = useState<Task[]>([]);
  const [pendingMonthTasks, setPendingMonthTasks] = useState<Task[]>([]);
  const [completedMonthTasks, setCompletedMonthTasks] = useState<Task[]>([]);

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

  // Función para obtener el primer y último día de la semana actual
  const getWeekDates = () => {
    const curr = new Date();
    const first = curr.getDate() - curr.getDay() + 1; // Primer día es lunes
    const last = first + 6; // Último día es domingo

    const firstDay = new Date(curr.setDate(first));
    firstDay.setHours(0, 0, 0, 0);

    const lastDay = new Date(curr.setDate(last)); // Importante: crear nueva instancia para no modificar 'firstDay'
    lastDay.setHours(23, 59, 59, 999);

    return { firstDay, lastDay };
  };

  // Función para obtener el primer y último día del mes actual
  const getMonthDates = () => {
    const curr = new Date();
    const firstDay = new Date(curr.getFullYear(), curr.getMonth(), 1);
    firstDay.setHours(0, 0, 0, 0);

    const lastDay = new Date(curr.getFullYear(), curr.getMonth() + 1, 0);
    lastDay.setHours(23, 59, 59, 999);

    return { firstDay, lastDay };
  };

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
        const formattedData = data.monthlySales.map((item: any) => ({
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
      const todayResponse = await getWorkerTasks({
        // MODIFICADO
        date: new Date().toISOString().split("T")[0],
        view: "daily",
      });

      // Obtener tareas de la semana
      const weekResponse = await getWorkerTasks({
        // MODIFICADO
        date: new Date().toISOString().split("T")[0],
        view: "weekly",
      });

      // Obtener tareas del mes
      const monthResponse = await getWorkerTasks({
        // MODIFICADO
        date: new Date().toISOString().split("T")[0],
        view: "monthly",
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
        const weeklyTasksFiltered = weekResponse.tasks.filter(
          (task) => task.state !== "FINALIZADO"
        );
        setTasksThisWeek(weeklyTasksFiltered.length);
        setWeeklyTasks(weekResponse.tasks);

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

      if (monthResponse?.tasks) {
        // Tareas pendientes del mes actual
        const pendingTasks = monthResponse.tasks.filter(
          (task) => task.state !== "FINALIZADO"
        );
        setPendingMonthTasks(pendingTasks);

        // Tareas completadas del mes actual
        const completedTasks = monthResponse.tasks.filter(
          (task) => task.state === "FINALIZADO"
        );
        setCompletedMonthTasks(completedTasks);
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
      ? quotationStats?.byStatus?.map((item: any) => ({
          name: getStatusLabel(item.status),
          value: item.count,
          amount: item.amount,
        })) || []
      : [];

    const topProductsData = hasTopProducts
      ? topProducts.map((product: any) => ({
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
                : "0%"
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
                : "0%"
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
                : "0%"
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
                : "0%"
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
          <span className="text-3xl font-bold mt-2">{tasksThisWeek}</span>
          <span className="text-xs text-content-subtle mt-1">
            {getWeekDates().firstDay.toLocaleDateString("es-CL")} -{" "}
            {getWeekDates().lastDay.toLocaleDateString("es-CL")}
          </span>
        </Card>

        <Card className="p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <span className="font-medium text-content-subtle">Vencidas</span>
          </div>
          <span className="text-3xl font-bold mt-2">{overdueItems}</span>
          <span className="text-xs text-content-subtle mt-1">
            Tareas con fecha pasada
          </span>
        </Card>

        <Card className="p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-purple-600" />
            </div>
            <span className="font-medium text-content-subtle">Completadas</span>
          </div>
          <span className="text-3xl font-bold mt-2">{tasksCompleted}</span>
          <span className="text-xs text-content-subtle mt-1">
            En la semana actual
          </span>
        </Card>
      </div>

      {/* Tareas de la semana actual */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold flex items-center">
            <CalendarClock className="mr-2 h-5 w-5 text-primary" />
            Tareas para esta semana
          </h2>
        </div>
        <div className="p-0">
          {tasksThisWeek > 0 ? (
            <div className="divide-y">
              {/* Vista de escritorio: Grid de 7 columnas */}
              <div className="hidden md:block">
                <div className="grid grid-cols-7 p-2 bg-accent/10 border-b">
                  <div className="text-center font-semibold">Lunes</div>
                  <div className="text-center font-semibold">Martes</div>
                  <div className="text-center font-semibold">Miércoles</div>
                  <div className="text-center font-semibold">Jueves</div>
                  <div className="text-center font-semibold">Viernes</div>
                  <div className="text-center font-semibold">Sábado</div>
                  <div className="text-center font-semibold">Domingo</div>
                </div>
                <div className="grid grid-cols-7 gap-1 p-2 min-h-32">
                  {Array(7)
                    .fill(0)
                    .map((_, index) => (
                      <div
                        key={index}
                        className="border rounded p-2 min-h-full"
                      >
                        {weeklyTasks
                          .filter((task) => {
                            const taskDate = new Date(task.startDate);
                            const dayOfWeek = taskDate.getDay();
                            // Ajustar para que lunes sea 0 y domingo 6
                            const adjustedDayOfWeek =
                              dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                            return adjustedDayOfWeek === index;
                          })
                          .map((task) => (
                            <div
                              key={task.id}
                              className="mb-2 bg-accent/5 p-2 rounded text-sm"
                            >
                              <p className="font-medium truncate">
                                {task.title}
                              </p>
                              <p className="text-xs text-content-subtle">
                                {formatDate(new Date(task.startDate), "HH:mm")}
                              </p>
                            </div>
                          ))}
                      </div>
                    ))}
                </div>
              </div>

              {/* Vista móvil: Lista simple agrupada por día */}
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
                  const tasksForDay = weeklyTasks.filter((task) => {
                    const taskDate = new Date(task.startDate);
                    const dayOfWeek = taskDate.getDay();
                    // Ajustar para que lunes sea 0 y domingo 6
                    const adjustedDayOfWeek =
                      dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                    return adjustedDayOfWeek === idx;
                  });

                  if (tasksForDay.length === 0) return null;

                  // Determinar si es hoy para resaltarlo
                  const todayDayIndex = new Date().getDay();
                  const adjustedToday =
                    todayDayIndex === 0 ? 6 : todayDayIndex - 1;
                  const isToday = adjustedToday === idx;

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
                        {day}{" "}
                        {isToday && (
                          <span className="text-xs ml-1 bg-primary text-white px-1.5 py-0.5 rounded-full">
                            Hoy
                          </span>
                        )}
                      </h4>
                      <div className="space-y-2">
                        {tasksForDay.map((task) => (
                          <div
                            key={task.id}
                            className="bg-accent/5 p-3 rounded"
                          >
                            <p className="font-medium">{task.title}</p>
                            <p className="text-xs text-content-subtle mt-1">
                              {formatDate(new Date(task.startDate), "HH:mm")}
                              {task.client && ` - ${task.client.name}`}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-medium">
                ¡Semana sin tareas pendientes!
              </h3>
              <p className="text-content-subtle mt-2">
                No tienes tareas asignadas para esta semana
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

      {/* Secciones de Tareas Pendientes y Trabajos Realizados */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tareas pendientes del mes */}
        <Card className="overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-primary" />
              Tareas pendientes del mes
            </h3>
          </div>
          <div className="p-0">
            {pendingMonthTasks.length > 0 ? (
              <div className="divide-y max-h-80 overflow-y-auto">
                {pendingMonthTasks.map((task) => (
                  <div key={task.id} className="p-4 hover:bg-accent/5">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{task.title}</h4>
                        <p className="text-sm text-content-subtle mt-1">
                          {formatDate(
                            new Date(task.startDate),
                            "dd MMM - HH:mm"
                          )}
                          {task.client && ` - ${task.client.name}`}
                        </p>
                      </div>
                      <Badge
                        className={
                          new Date(task.startDate) < new Date() &&
                          task.state !== "FINALIZADO"
                            ? "bg-red-100 text-red-800"
                            : "bg-blue-100 text-blue-800"
                        }
                      >
                        {new Date(task.startDate) < new Date() &&
                        task.state !== "FINALIZADO"
                          ? "Vencida"
                          : "Pendiente"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-lg font-medium">Sin tareas pendientes</h3>
                <p className="text-content-subtle mt-2">
                  No tienes tareas pendientes para este mes
                </p>
              </div>
            )}
          </div>
          <div className="p-4 border-t bg-accent/5">
            <Link href="/dashboard/agenda?filter=pending">
              <Button variant="outline" className="w-full">
                Ver todas las tareas pendientes
              </Button>
            </Link>
          </div>
        </Card>

        {/* Trabajos realizados en el mes */}
        <Card className="overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-primary" />
              Trabajos realizados este mes
            </h3>
          </div>
          <div className="p-0">
            {completedMonthTasks.length > 0 ? (
              <div className="divide-y max-h-80 overflow-y-auto">
                {completedMonthTasks.map((task) => (
                  <div key={task.id} className="p-4 hover:bg-accent/5">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{task.title}</h4>
                        <p className="text-sm text-content-subtle mt-1">
                          Completado el{" "}
                          {formatDate(
                            new Date(task.endDate || task.startDate),
                            "dd MMM - HH:mm"
                          )}
                          {task.client && ` - ${task.client.name}`}
                        </p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        Completado
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
                <h3 className="text-lg font-medium">
                  Sin trabajos completados
                </h3>
                <p className="text-content-subtle mt-2">
                  No has completado tareas este mes
                </p>
              </div>
            )}
          </div>
          <div className="p-4 border-t bg-accent/5">
            <Link href="/dashboard/agenda?filter=completed">
              <Button variant="outline" className="w-full">
                Ver todos los trabajos completados
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

// Componente Badge (reutilizable)
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
