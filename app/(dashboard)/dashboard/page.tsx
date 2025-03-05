// app/(dashboard)/dashboard/page.tsx
"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card } from "@/components/ui/card";
import {
  EyeIcon,
  TrendingUpIcon,
  UsersIcon,
  FilterIcon,
  DownloadIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { StatsCard } from "@/components/dashboard/stats-card";
import { IntegrationsList } from "@/components/dashboard/integrations-list";
import { SalesDistribution } from "@/components/dashboard/sales-distribution";

const pageViewsData = [
  { mes: "Oct", valor: 2988.2 },
  { mes: "Nov", valor: 1765.09 },
  { mes: "Dic", valor: 4005.65 },
];

const weeklyData = [
  { day: "Dom", value: 1200 },
  { day: "Lun", value: 1800 },
  { day: "Mar", value: 3874 },
  { day: "Mie", value: 2200 },
  { day: "Jue", value: 2800 },
  { day: "Vie", value: 2400 },
  { day: "Sab", value: 2100 },
];

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState({
    start: new Date(),
    end: new Date(),
  });

  const stats = [
    {
      title: "Vistas de página",
      value: "12,450",
      change: "+15.8%",
      trend: "up",
      icon: EyeIcon,
    },
    {
      title: "Ingresos totales",
      value: "$363.95",
      change: "-34.0%",
      trend: "down",
      icon: TrendingUpIcon,
    },
    {
      title: "Tasa de rebote",
      value: "86.5%",
      change: "+24.2%",
      trend: "up",
      icon: UsersIcon,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Oct 18 - Nov 18</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            className="w-full sm:w-auto"
          />
          <Button variant="outline" size="icon" className="hidden sm:flex">
            <FilterIcon className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="hidden sm:flex">
            <DownloadIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <StatsCard
            key={index}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            trend={stat.trend as "up" | "down"}
            icon={stat.icon}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Resumen de ventas</h3>
            <Button variant="outline" size="sm">
              <FilterIcon className="h-4 w-4 mr-2" />
              Filtrar
            </Button>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={pageViewsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="valor"
                  stroke="#6366F1"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Suscriptores totales</h3>
            <select className="text-sm border rounded-md px-2 py-1">
              <option>Semanal</option>
              <option>Mensual</option>
              <option>Anual</option>
            </select>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesDistribution />
        <IntegrationsList />
      </div>
    </div>
  );
}
