"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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

import { getWorkerTasks, type Task } from "@/services/tasks";
import { getQuotationStats } from "@/services/quotations";
import { getSalesStats, getTopProducts } from "@/services/reports";
import { getUpcomingMaintenances } from "@/services/maintenance";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { StatsCard } from "@/components/dashboard/stats-card";
import { useNotification } from "@/contexts/NotificationContext";

const COLORS = [
  "#b42516",
  "#2563eb",
  "#16a34a",
  "#eab308",
  "#8b5cf6",
  "#ec4899",
];

// Helper components moved outside the main component
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
  const isInitialMount = useRef(true);

  // State for both Admin and Technician views
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    end: new Date(),
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Technician-specific state
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [overdueItems, setOverdueItems] = useState(0);
  const [tasksToday, setTasksToday] = useState(0);
  const [tasksThisWeek, setTasksThisWeek] = useState(0);
  const [tasksCompleted, setTasksCompleted] = useState(0);
  const [weeklyTasks, setWeeklyTasks] = useState<Task[]>([]);
  const [pendingMonthTasks, setPendingMonthTasks] = useState<Task[]>([]);
  const [completedMonthTasks, setCompletedMonthTasks] = useState<Task[]>([]);

  // Admin-specific state
  const [salesData, setSalesData] = useState<any[]>([]);
  const [quotationStats, setQuotationStats] = useState<any>(null);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [upcomingMaintenances, setUpcomingMaintenances] = useState<any[]>([]);

  const isAdmin = session?.user?.role === "ADMIN";
  const today = new Date();
  const formattedDate = formatDate(today, "EEEE, dd 'de' MMMM, yyyy");

  // Memoized fetch functions
  const fetchTechnicianData = useCallback(async () => {
    setIsLoading(true);
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      
      // Fetched in parallel for performance
      const [todayResponse, weekResponse, monthResponse] = await Promise.all([
        getWorkerTasks({ date: todayStr, view: "daily" }),
        getWorkerTasks({ date: todayStr, view: "weekly" }),
        getWorkerTasks({ date: todayStr, view: "monthly" }),
      ]);

      if (todayResponse?.tasks) {
        const todayTasksFiltered = todayResponse.tasks.filter(
          (task) => task.state !== "FINALIZADO"
        );
        setTasksToday(todayTasksFiltered.length);

        const pendingTasks = todayResponse.tasks
          .filter((task) => task.state === "PENDIENTE")
          .slice(0, 3);
        setUpcomingTasks(pendingTasks);
      }

      if (weekResponse?.tasks) {
        const weeklyTasksFiltered = weekResponse.tasks.filter(
          (task) => task.state !== "FINALIZADO"
        );
        setTasksThisWeek(weeklyTasksFiltered.length);
        setWeeklyTasks(weekResponse.tasks);

        const overdue = weekResponse.tasks.filter((task) => {
          const taskDate = new Date(task.startDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return task.state !== "FINALIZADO" && taskDate < today;
        });
        setOverdueItems(overdue.length);

        const completed = weekResponse.tasks.filter(
          (task) => task.state === "FINALIZADO"
        );
        setTasksCompleted(completed.length);
      }

      if (monthResponse?.tasks) {
        const pendingTasks = monthResponse.tasks.filter(
          (task) => task.state !== "FINALIZADO"
        );
        setPendingMonthTasks(pendingTasks);

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
  }, [addNotification]);

  const fetchAdminData = useCallback(async () => {
    setIsLoading(true);
    if (!dateRange.start || !dateRange.end) {
        addNotification("warning", "Por favor, seleccione un rango de fechas válido.");
        setIsLoading(false);
        return;
    }
    const startDate = formatDate(dateRange.start, "yyyy-MM-dd");
    const endDate = formatDate(dateRange.end, "yyyy-MM-dd");

    try {
        const [sales, stats, products] = await Promise.all([
            getSalesStats("month", startDate, endDate),
            getQuotationStats({ startDate, endDate }),
            getTopProducts(5, startDate, endDate),
        ]);

        // Process Sales Data
        if (sales && sales.monthlySales && sales.monthlySales.length > 0) {
            setSalesData(sales.monthlySales.map((item: any) => ({
                mes: item.month,
                valor: item.total || 0,
                cantidad: item.count || 0,
            })));
        } else {
            setSalesData([]);
        }

        // Process Quotation Stats
        setQuotationStats(stats || { summary: {}, byStatus: [] });

        // Process Top Products
        setTopProducts(products || []);

    } catch (error) {
        console.error("Error al cargar datos del dashboard admin:", error);
        addNotification("error", "Error al cargar datos del dashboard");
    } finally {
        setIsLoading(false);
    }
}, [dateRange, addNotification]);

  const fetchUpcomingMaintenances = useCallback(async () => {
    try {
      const data = await getUpcomingMaintenances(30);
      setUpcomingMaintenances(data ? data.slice(0, 5) : []);
    } catch (error) {
      console.error("Error al cargar mantenimientos próximos:", error);
      addNotification("error", "Error al cargar mantenimientos próximos");
    }
  }, [addNotification]);

  // Effect for initial data load
  useEffect(() => {
    if (sessionStatus === "authenticated") {
      if (isAdmin) {
        // Fetch data that doesn't depend on date range
        fetchUpcomingMaintenances();
      } else {
        fetchTechnicianData();
      }
    }
  }, [sessionStatus, isAdmin, fetchTechnicianData, fetchUpcomingMaintenances]);

  // Effect for admin data that depends on date range
  useEffect(() => {
    if (sessionStatus === "authenticated" && isAdmin) {
      // Avoid fetching on the very first mount, as the initial load effect already handles it.
      if (isInitialMount.current) {
        isInitialMount.current = false;
        // The first load is triggered by the effect above
        fetchAdminData();
      } else {
        // Subsequent loads are triggered by dateRange changes
        fetchAdminData();
      }
    }
  }, [sessionStatus, isAdmin, dateRange, fetchAdminData]);

  const refreshAdminData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchAdminData(),
        fetchUpcomingMaintenances(),
      ]);
      addNotification("success", "Datos actualizados correctamente");
    } catch (error) {
      console.error("Error al actualizar datos:", error);
      addNotification("error", "Error al actualizar datos");
    } finally {
      setIsRefreshing(false);
    }
  }, [addNotification, fetchAdminData, fetchUpcomingMaintenances]);


  const handleDateRangeChange = (range: { start: Date; end: Date }) => {
    if (range.start && range.end) {
      setDateRange({
        start: new Date(range.start),
        end: new Date(range.end),
      });
    }
  };

  if (sessionStatus === "loading" || isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-96">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-content-subtle">
          Cargando panel de control...
        </p>
      </div>
    );
  }

  // Admin View
  if (isAdmin) {
    const hasQuotationStats = quotationStats?.summary?.totalCount > 0;
    const hasSalesData = salesData.length > 0;
    const hasTopProducts = topProducts.length > 0;
    const hasMaintenances = upcomingMaintenances.length > 0;

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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-content-emphasis">Dashboard</h1>
                    <p className="text-sm text-content-subtle">
                        {dateRange.start && formatDate(dateRange.start, "dd MMM, yyyy")} - {dateRange.end && formatDate(dateRange.end, "dd MMM, yyyy")}
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <DateRangePicker
                        value={dateRange}
                        onChange={handleDateRangeChange}
                        className="w-full sm:w-auto"
                    />
                    <Button variant="outline" size="icon" className="hidden sm:flex" onClick={refreshAdminData} disabled={isRefreshing}>
                        {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard title="Cotizaciones" value={quotationStats?.summary?.totalCount?.toString() || "0"} change={`${quotationStats?.summary?.percentChange?.toFixed(1) || 0}%`} trend={quotationStats?.summary?.percentChange >= 0 ? "up" : "down"} icon={FileText} />
                <StatsCard title="Ventas totales" value={formatCurrency(quotationStats?.summary?.totalAmount || 0)} change={`${quotationStats?.summary?.amountPercentChange?.toFixed(1) || 0}%`} trend={quotationStats?.summary?.amountPercentChange >= 0 ? "up" : "down"} icon={DollarSign} />
                <StatsCard title="Tareas asignadas" value={quotationStats?.summary?.tasksCount?.toString() || "0"} change={`${quotationStats?.summary?.tasksPercentChange?.toFixed(1) || 0}%`} trend={quotationStats?.summary?.tasksPercentChange >= 0 ? "up" : "down"} icon={CalendarClock} />
                <StatsCard title="Tasa de aprobación" value={`${(quotationStats?.summary?.approvalRate || 0).toFixed(1)}%`} change={`${quotationStats?.summary?.approvalRateChange?.toFixed(1) || 0}%`} trend={quotationStats?.summary?.approvalRateChange >= 0 ? "up" : "down"} icon={TrendingUp} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-6">Resumen de ventas</h3>
                    <div className="h-80">
                        {hasSalesData ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={salesData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="mes" />
                                    <YAxis yAxisId="left" orientation="left" stroke="#b42516" tickFormatter={(value) => formatCurrency(value, 0)} />
                                    <YAxis yAxisId="right" orientation="right" stroke="#2563eb" />
                                    <Tooltip formatter={(value, name) => name === "Monto ($)" ? formatCurrency(value) : value} />
                                    <Legend />
                                    <Bar yAxisId="left" dataKey="valor" name="Monto ($)" fill="#b42516" barSize={20} />
                                    <Bar yAxisId="right" dataKey="cantidad" name="Cantidad" fill="#2563eb" barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <BarChart2 className="h-12 w-12 text-content-subtle mb-2 opacity-50" />
                                <p className="text-content-subtle">No hay datos de ventas para el período seleccionado.</p>
                            </div>
                        )}
                    </div>
                </Card>
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-6">Cotizaciones por estado</h3>
                    <div className="h-80">
                        {quotationByStatusData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={quotationByStatusData} cx="50%" cy="50%" outerRadius={100} fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                                        {quotationByStatusData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip formatter={(value, name, props) => [`${value} (${(props.payload.percent * 100).toFixed(1)}%)`, name]} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <PieChart className="h-12 w-12 text-content-subtle mb-2 opacity-50" />
                                <p className="text-content-subtle">No hay datos de cotizaciones para el período seleccionado.</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <Card className="overflow-hidden">
                    <div className="p-6 border-b"><h3 className="text-lg font-semibold flex items-center"><PackageIcon className="h-5 w-5 mr-2 text-primary" />Productos más vendidos</h3></div>
                    <div className="p-0">
                        {hasTopProducts ? (
                            <div className="divide-y">
                                {topProductsData.map((product, index) => (
                                    <div key={index} className="p-4 hover:bg-accent/5 flex justify-between items-center">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center mr-3"><span className="font-semibold text-sm">{index + 1}</span></div>
                                            <div>
                                                <h4 className="font-medium">{product.name}</h4>
                                                <p className="text-sm text-content-subtle">{product.cantidad} unidades</p>
                                            </div>
                                        </div>
                                        <span className="font-semibold">{formatCurrency(product.valor)}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                <PackageIcon className="h-12 w-12 text-content-subtle mb-4 opacity-50" />
                                <h3 className="text-lg font-medium">Sin datos de productos</h3>
                                <p className="text-content-subtle mt-2">No hay información de ventas de productos en el período seleccionado.</p>
                            </div>
                        )}
                    </div>
                    <div className="p-4 border-t bg-accent/5"><Link href="/dashboard/products"><Button variant="outline" className="w-full">Ver todos los productos</Button></Link></div>
                </Card>
                <Card className="overflow-hidden">
                    <div className="p-6 border-b"><h3 className="text-lg font-semibold flex items-center"><Calendar className="h-5 w-5 mr-2 text-primary" />Mantenimientos próximos</h3></div>
                    <div className="p-0">
                        {hasMaintenances ? (
                            <div className="divide-y">
                                {upcomingMaintenances.map((maintenance) => (
                                    <div key={maintenance.id} className="p-4 hover:bg-accent/5">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-medium">{maintenance.client ? maintenance.client.name : "Cliente sin asignar"}</h4>
                                                <p className="text-sm text-content-subtle mt-1">Próximo: {formatDate(new Date(maintenance.nextMaintenanceDate), "dd MMM, yyyy")}</p>
                                            </div>
                                            <CustomBadge className={getMaintenanceStatusClass(maintenance.nextMaintenanceDate)}>{getMaintenanceStatusLabel(maintenance.nextMaintenanceDate)}</CustomBadge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                <Calendar className="h-12 w-12 text-content-subtle mb-4 opacity-50" />
                                <h3 className="text-lg font-medium">Sin mantenimientos próximos</h3>
                                <p className="text-content-subtle mt-2">No hay mantenimientos programados para los próximos 30 días.</p>
                            </div>
                        )}
                    </div>
                    <div className="p-4 border-t bg-accent/5"><Link href="/dashboard/maintenance"><Button variant="outline" className="w-full">Ver todos los mantenimientos</Button></Link></div>
                </Card>
            </div>
        </div>
    );
  }

  // Technician View
  return (
    <div className="space-y-8">
        <div>
            <h1 className="text-3xl font-bold text-content-emphasis">Hola, {session?.user?.name?.split(" ")[0] || "Técnico"}</h1>
            <p className="text-content-subtle mt-1">{formattedDate}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6 flex flex-col"><div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center"><Clock className="h-5 w-5 text-blue-600" /></div><span className="font-medium text-content-subtle">Tareas Hoy</span></div><span className="text-3xl font-bold mt-2">{tasksToday}</span><Link href="/dashboard/agenda" className="text-primary text-sm mt-auto font-medium flex items-center">Ver agenda <ChevronRight className="h-4 w-4 ml-1" /></Link></Card>
            <Card className="p-6 flex flex-col"><div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center"><CalendarClock className="h-5 w-5 text-green-600" /></div><span className="font-medium text-content-subtle">Esta semana</span></div><span className="text-3xl font-bold mt-2">{tasksThisWeek}</span></Card>
            <Card className="p-6 flex flex-col"><div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center"><AlertTriangle className="h-5 w-5 text-red-600" /></div><span className="font-medium text-content-subtle">Vencidas</span></div><span className="text-3xl font-bold mt-2">{overdueItems}</span></Card>
            <Card className="p-6 flex flex-col"><div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center"><CheckCircle className="h-5 w-5 text-purple-600" /></div><span className="font-medium text-content-subtle">Completadas</span></div><span className="text-3xl font-bold mt-2">{tasksCompleted}</span><span className="text-xs text-content-subtle mt-1">En la semana actual</span></Card>
        </div>
        
        {/* Weekly Tasks View */}
        <Card className="overflow-hidden">
            <div className="p-6 border-b">
                <h2 className="text-xl font-semibold flex items-center">
                    <CalendarClock className="mr-2 h-5 w-5 text-primary" />
                    Tareas para esta semana
                </h2>
            </div>
            <div className="p-0">
                {weeklyTasks.length > 0 ? (
                     <div className="md:hidden">
                        {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"].map((day, idx) => {
                            const tasksForDay = weeklyTasks.filter(task => ((new Date(task.startDate).getDay() + 6) % 7) === idx);
                            if (tasksForDay.length === 0) return null;
                            const isToday = ((new Date().getDay() + 6) % 7) === idx;
                            return (
                                <div key={idx} className={`p-3 ${isToday ? "bg-accent/10" : ""}`}>
                                    <h4 className={`font-medium text-sm mb-2 ${isToday ? "text-primary font-semibold" : "text-content-subtle"}`}>{day} {isToday && <span className="text-xs ml-1 bg-primary text-white px-1.5 py-0.5 rounded-full">Hoy</span>}</h4>
                                    <div className="space-y-2">
                                        {tasksForDay.map(task => (
                                            <div key={task.id} className="bg-accent/5 p-3 rounded"><p className="font-medium">{task.title}</p><p className="text-xs text-content-subtle mt-1">{formatDate(new Date(task.startDate), "HH:mm")} {task.client && `- ${task.client.name}`}</p></div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                        <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                        <h3 className="text-lg font-medium">¡Semana sin tareas pendientes!</h3>
                        <p className="text-content-subtle mt-2">No tienes tareas asignadas para esta semana.</p>
                    </div>
                )}
            </div>
            <div className="p-4 border-t bg-accent/5">
                <Link href="/dashboard/agenda"><Button variant="outline" className="w-full">Ver agenda completa</Button></Link>
            </div>
        </Card>
    </div>
  );
}

// Helper functions kept outside the component for performance
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