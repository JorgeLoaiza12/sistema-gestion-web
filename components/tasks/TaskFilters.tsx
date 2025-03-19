import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
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
}

export default function TaskFilters({
  filters,
  onFilterChange,
  searchTerm,
  onSearchChange,
  onAddTask,
  isAdmin,
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
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Vista" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Diaria</SelectItem>
              <SelectItem value="weekly">Semanal</SelectItem>
              <SelectItem value="monthly">Mensual</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="date"
            value={filters.date}
            onChange={(e) =>
              onFilterChange({ ...filters, date: e.target.value })
            }
            className="w-[150px]"
          />

          <Select
            value={filters.state || ""}
            onValueChange={(value) =>
              onFilterChange({ ...filters, state: value || undefined })
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Estado" />
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

        <Input
          placeholder="Buscar tareas..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="md:w-60"
        />

        {isAdmin && (
          <Button onClick={onAddTask} className="whitespace-nowrap">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Tarea
          </Button>
        )}
      </div>
    </div>
  );
}
