import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, CalendarIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Constantes para tipos y estados de tareas
const TASK_STATES = ["PENDIENTE", "EN_CURSO", "FINALIZADO"];

interface TasksFilterOptions {
  view: "daily" | "weekly" | "monthly";
  date: string;
  state?: string;
}

interface TaskFiltersProps {
  filters: TasksFilterOptions;
  onFilterChange: (newFilters: TasksFilterOptions) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onAddTask: () => void;
  isAdmin: boolean;
  isLoading?: boolean;
}

export default function TaskFilters({
  filters,
  onFilterChange,
  searchTerm,
  onSearchChange,
  onAddTask,
  isAdmin,
  isLoading = false,
}: TaskFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
      <h2 className="text-xl font-semibold">Lista de Tareas</h2>
      <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
        <div className="flex gap-2">
          <Select
            value={filters.view}
            onValueChange={(value: "daily" | "weekly" | "monthly") =>
              onFilterChange({ ...filters, view: value })
            }
            disabled={isLoading}
          >
            <SelectTrigger className="w-[120px]">
              {isLoading ? (
                <div className="flex items-center">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <span>Cargando</span>
                </div>
              ) : (
                <SelectValue placeholder="Vista" />
              )}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Diaria</SelectItem>
              <SelectItem value="weekly">Semanal</SelectItem>
              <SelectItem value="monthly">Mensual</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative">
            <Input
              type="date"
              value={filters.date}
              onChange={(e) =>
                onFilterChange({ ...filters, date: e.target.value })
              }
              className="w-[150px]"
              disabled={isLoading}
            />
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-md">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
            )}
          </div>

          <Select
            value={filters.state || ""}
            onValueChange={(value) =>
              onFilterChange({ ...filters, state: value || undefined })
            }
            disabled={isLoading}
          >
            <SelectTrigger className="w-[140px]">
              {isLoading ? (
                <div className="flex items-center">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <span>Cargando</span>
                </div>
              ) : (
                <SelectValue placeholder="Estado" />
              )}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">Todos</SelectItem>
              {TASK_STATES.map((state) => (
                <SelectItem key={state} value={state}>
                  {state === "PENDIENTE"
                    ? "Pendiente"
                    : state === "EN_CURSO"
                    ? "En curso"
                    : "Finalizado"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="relative">
          <Input
            placeholder="Buscar tareas..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="md:w-60"
            disabled={isLoading}
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          )}
        </div>

        {isAdmin && (
          <Button
            onClick={onAddTask}
            className="whitespace-nowrap"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Nueva Tarea
          </Button>
        )}
      </div>
    </div>
  );
}
