//web\components\dashboard\date-range-picker.tsx
"use client";

import * as React from "react";
import { addDays, format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, CalendarDays, HelpCircle } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DateRangePickerProps {
  value: { start: Date; end: Date };
  onChange: (range: { start: Date; end: Date }) => void;
  className?: string;
}

export function DateRangePicker({
  value,
  onChange,
  className,
}: DateRangePickerProps) {
  // Estado local para manejar el rango de fechas seleccionado
  const [date, setDate] = React.useState<DateRange>({
    from: value.start,
    to: value.end,
  });

  // Estado para rastrear si estamos seleccionando la fecha de inicio o fin
  const [selectionMode, setSelectionMode] = React.useState<
    "start" | "end" | "complete"
  >("complete");

  // Estado para el popover
  const [open, setOpen] = React.useState(false);

  // Actualiza el estado interno cuando las props cambian desde fuera
  React.useEffect(() => {
    console.log("DateRangePicker recibió nuevas props:", {
      start: value.start.toISOString(),
      end: value.end.toISOString(),
    });

    setDate({
      from: new Date(value.start),
      to: new Date(value.end),
    });
  }, [value.start, value.end]);

  // Presets rápidos para selección de rango
  const presets = [
    {
      label: "Últimos 7 días",
      value: {
        from: addDays(new Date(), -7),
        to: new Date(),
      },
    },
    {
      label: "Últimos 30 días",
      value: {
        from: addDays(new Date(), -30),
        to: new Date(),
      },
    },
    {
      label: "Este mes",
      value: {
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        to: new Date(),
      },
    },
    {
      label: "Último trimestre",
      value: {
        from: addDays(new Date(), -90),
        to: new Date(),
      },
    },
  ];

  // Función para aplicar un preset
  const handlePresetChange = (preset: DateRange) => {
    console.log("Preset seleccionado:", {
      from: preset.from?.toISOString(),
      to: preset.to?.toISOString(),
    });

    setDate(preset);
    setSelectionMode("complete");

    // Notificar inmediatamente al componente padre
    if (preset.from && preset.to) {
      const newRange = {
        start: new Date(preset.from),
        end: new Date(preset.to),
      };
      console.log("Notificando al padre desde preset:", newRange);
      onChange(newRange);
    }

    setOpen(false); // Cerrar popover después de seleccionar
  };

  // Función para aplicar el rango y cerrar el popover
  const applyRange = () => {
    if (date && date.from && date.to) {
      const newRange = {
        start: new Date(date.from),
        end: new Date(date.to),
      };
      console.log("Aplicando rango con el botón:", newRange);
      onChange(newRange);
      setOpen(false);
    }
  };

  // Función para reiniciar la selección
  const resetSelection = () => {
    setDate({
      from: value.start,
      to: value.end,
    });
    setSelectionMode("start");
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "dd MMM yyyy", { locale: es })} -{" "}
                  {format(date.to, "dd MMM yyyy", { locale: es })}
                </>
              ) : (
                format(date.from, "dd MMM yyyy", { locale: es })
              )
            ) : (
              <span>Seleccionar periodo</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0"
          align="center"
          style={{
            backgroundColor: "white",
            border: "1px solid rgba(0,0,0,0.1)",
          }}
        >
          <div className="p-3 flex justify-between items-center border-b">
            <div className="text-sm font-medium flex items-center">
              <CalendarDays className="mr-2 h-4 w-4" />
              {selectionMode === "start"
                ? "Selecciona fecha de inicio"
                : selectionMode === "end"
                ? "Selecciona fecha de fin"
                : "Rango seleccionado"}
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Primero selecciona la fecha de inicio, luego la de fin.</p>
                  <p>
                    Las fechas se aplicarán al hacer clic en "Aplicar rango".
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="flex flex-wrap gap-1 p-3 border-b justify-between">
            {presets.map((preset) => (
              <Button
                key={preset.label}
                variant="outline"
                size="sm"
                className="text-xs flex-1 min-w-[110px]"
                onClick={() => handlePresetChange(preset.value)}
              >
                {preset.label}
              </Button>
            ))}
          </div>

          <div className="p-3">
            <div className="mb-1 text-xs text-muted-foreground">
              {selectionMode === "start"
                ? "Haz clic en una fecha para establecer el inicio"
                : selectionMode === "end"
                ? "Ahora selecciona la fecha de fin"
                : "Rango completo seleccionado"}
            </div>

            {/* Estilos globales para los días del calendario */}
            <style jsx global>{`
              /* Estilo para todos los días intermedios del rango */
              .rdp-day_range_middle {
                background-color: rgba(220, 38, 38, 0.1) !important;
                position: relative;
                z-index: 1;
              }

              /* Agregar un fondo continuo para los días del rango */
              .rdp-day_range_middle::before {
                content: "";
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(220, 38, 38, 0.1);
                z-index: -1;
              }

              /* Día de inicio del rango */
              .rdp-day_range_start {
                background-color: rgb(220, 38, 38) !important;
                color: white !important;
                font-weight: bold !important;
                border-radius: 50% !important;
                position: relative;
                z-index: 2;
              }

              /* Día de fin del rango */
              .rdp-day_range_end {
                background-color: rgb(220, 38, 38) !important;
                color: white !important;
                font-weight: bold !important;
                border-radius: 50% !important;
                position: relative;
                z-index: 2;
              }

              /* Color para día seleccionado */
              .rdp-day_selected {
                background-color: rgb(220, 38, 38) !important;
                color: white !important;
              }

              /* Estilo para el rango completo (fondo continuo) */
              .rdp-day_range_middle::after {
                content: "";
                position: absolute;
                height: 24px; /* Altura del rectángulo de fondo */
                top: 50%;
                transform: translateY(-50%);
                left: 0;
                right: 0;
                background-color: rgba(220, 38, 38, 0.1);
                z-index: -1;
              }

              /* Mejorar la visualización en hover */
              .rdp-day:hover:not(.rdp-day_range_start):not(
                  .rdp-day_range_end
                ):not(.rdp-day_selected) {
                background-color: rgba(220, 38, 38, 0.05) !important;
                border-radius: 0 !important;
              }
            `}</style>

            <Calendar
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={(newDate) => {
                console.log("Calendar onSelect:", newDate);
                if (newDate) {
                  setDate(newDate);
                  if (newDate?.from && !newDate.to) setSelectionMode("end");
                  if (newDate?.from && newDate.to) setSelectionMode("complete");
                }
              }}
              numberOfMonths={2}
              locale={es}
              className="bg-white"
              footer={
                <div className="pt-2 text-center border-t mt-2">
                  <div className="flex justify-between px-2 text-xs">
                    {date.from && (
                      <div className="flex flex-col items-start">
                        <span className="text-gray-500">Inicio:</span>
                        <span className="text-red-600 font-medium">
                          {format(date.from, "dd MMM yyyy", { locale: es })}
                        </span>
                      </div>
                    )}
                    {date.to && (
                      <div className="flex flex-col items-end">
                        <span className="text-gray-500">Fin:</span>
                        <span className="text-red-600 font-medium">
                          {format(date.to, "dd MMM yyyy", { locale: es })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              }
            />
          </div>

          <div className="p-3 border-t bg-gray-50 flex gap-2 justify-between">
            <Button
              variant="outline"
              size="sm"
              className="w-1/2"
              onClick={resetSelection}
            >
              Reiniciar
            </Button>
            <Button
              size="sm"
              className="w-1/2 bg-red-600 hover:bg-red-700"
              onClick={applyRange}
              disabled={!date.from || !date.to}
            >
              Aplicar rango
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
