// components/dashboard/date-range-picker.tsx
"use client";

import * as React from "react";
import { addDays, format, isValid } from "date-fns";
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
  value: { start?: Date; end?: Date };
  onChange: (range: { start?: Date; end?: Date }) => void;
  className?: string;
}

export function DateRangePicker({
  value,
  onChange,
  className,
}: DateRangePickerProps) {
  const [date, setDate] = React.useState<DateRange | undefined>(() => {
    const validStart =
      value.start instanceof Date && isValid(value.start)
        ? new Date(value.start)
        : undefined;
    const validEnd =
      value.end instanceof Date && isValid(value.end)
        ? new Date(value.end)
        : undefined;
    if (validStart || validEnd) {
      return { from: validStart, to: validEnd };
    }
    return undefined;
  });

  const [selectionMode, setSelectionMode] = React.useState<
    "start" | "end" | "complete"
  >(
    value.start && value.end && isValid(value.start) && isValid(value.end)
      ? "complete"
      : "start"
  );
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const propStart = value.start;
    const propEnd = value.end;

    const validPropStart =
      propStart instanceof Date && isValid(propStart)
        ? new Date(propStart)
        : undefined;
    const validPropEnd =
      propEnd instanceof Date && isValid(propEnd)
        ? new Date(propEnd)
        : undefined;

    let newSelectionMode: "start" | "end" | "complete" = "start";
    if (validPropStart && !validPropEnd) {
      newSelectionMode = "end";
    } else if (validPropStart && validPropEnd) {
      newSelectionMode = "complete";
    }

    const internalStart = date?.from;
    const internalEnd = date?.to;

    const propsActuallyChanged =
      validPropStart?.getTime() !== internalStart?.getTime() ||
      validPropEnd?.getTime() !== internalEnd?.getTime() ||
      (validPropStart === undefined && internalStart !== undefined) ||
      (validPropEnd === undefined && internalEnd !== undefined);

    if (propsActuallyChanged) {
      setDate({ from: validPropStart, to: validPropEnd });
      setSelectionMode(newSelectionMode);
    } else if (!validPropStart && !validPropEnd && date !== undefined) {
      setDate(undefined);
      setSelectionMode("start");
    }
  }, [value.start, value.end]);

  const presets = [
    {
      label: "Últimos 7 días",
      value: {
        from: addDays(new Date(), -6),
        to: new Date(),
      },
    },
    {
      label: "Últimos 30 días",
      value: {
        from: addDays(new Date(), -29),
        to: new Date(),
      },
    },
    {
      label: "Este mes",
      value: {
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        to: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
      },
    },
    {
      label: "Último trimestre",
      value: {
        from: addDays(new Date(), -89),
        to: new Date(),
      },
    },
  ];

  const handlePresetChange = (presetValue?: DateRange) => {
    if (
      presetValue?.from &&
      presetValue?.to &&
      isValid(presetValue.from) &&
      isValid(presetValue.to)
    ) {
      const newFrom = new Date(presetValue.from);
      const newTo = new Date(presetValue.to);
      setDate({ from: newFrom, to: newTo });
      setSelectionMode("complete");
      onChange({ start: newFrom, end: newTo });
      setOpen(false);
    }
  };

  const applyRange = () => {
    if (date?.from && isValid(date.from) && date?.to && isValid(date.to)) {
      onChange({ start: new Date(date.from), end: new Date(date.to) });
      setOpen(false);
    } else if (date?.from && isValid(date.from) && !date?.to) {
      onChange({ start: new Date(date.from), end: new Date(date.from) });
      setOpen(false);
    }
  };

  const resetSelection = () => {
    setDate(undefined);
    setSelectionMode("start");
    onChange({ start: undefined, end: undefined });
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
              !date?.from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from && isValid(date.from) ? (
              date.to && isValid(date.to) ? (
                <>
                  {format(date.from, "dd MMM yy", { locale: es })} -
                  {format(date.to, "dd MMM yy", { locale: es })}
                </>
              ) : (
                format(date.from, "dd MMM yy", { locale: es })
              )
            ) : (
              <span>Seleccionar periodo</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0 max-h-[90vh] overflow-y-auto" // Added max-h-[90vh] and overflow-y-auto
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
              {/* Corrected: This was missing its closing tag */}
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
            {/* Corrected: Closing tag added */}
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

            <style jsx global>{`
              .rdp-day_range_middle {
                background-color: rgba(220, 38, 38, 0.1) !important;
                position: relative;
                z-index: 1;
              }
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
              .rdp-day_range_start {
                background-color: rgb(220, 38, 38) !important;
                color: white !important;
                font-weight: bold !important;
                border-radius: 50% !important;
                position: relative;
                z-index: 2;
              }
              .rdp-day_range_end {
                background-color: rgb(220, 38, 38) !important;
                color: white !important;
                font-weight: bold !important;
                border-radius: 50% !important;
                position: relative;
                z-index: 2;
              }
              .rdp-day_selected {
                background-color: rgb(220, 38, 38) !important;
                color: white !important;
              }
              .rdp-day_range_middle::after {
                content: "";
                position: absolute;
                height: 24px;
                top: 50%;
                transform: translateY(-50%);
                left: 0;
                right: 0;
                background-color: rgba(220, 38, 38, 0.1);
                z-index: -1;
              }
              .rdp-day:hover:not(.rdp-day_range_start):not(
                  .rdp-day_range_end
                ):not(.rdp-day_selected) {
                background-color: rgba(220, 38, 38, 0.05) !important;
                border-radius: 0 !important;
              }
            `}</style>

            <Calendar
              mode="range"
              defaultMonth={
                date?.from && isValid(date.from) ? date.from : new Date()
              }
              selected={date}
              onSelect={(newDateRange) => {
                if (newDateRange) {
                  setDate(newDateRange);
                  if (newDateRange.from && !newDateRange.to) {
                    setSelectionMode("end");
                  } else if (newDateRange.from && newDateRange.to) {
                    setSelectionMode("complete");
                  } else {
                    setSelectionMode("start");
                  }
                } else {
                  setDate(undefined);
                  setSelectionMode("start");
                }
              }}
              numberOfMonths={2}
              locale={es}
              className="bg-white"
              footer={
                <div className="pt-2 text-center border-t mt-2">
                  <div className="flex justify-between px-2 text-xs">
                    {date?.from && isValid(date.from) && (
                      <div className="flex flex-col items-start">
                        <span className="text-gray-500">Inicio:</span>
                        <span className="text-red-600 font-medium">
                          {format(date.from, "dd MMM yy", { locale: es })}
                        </span>
                      </div>
                    )}
                    {date?.to && isValid(date.to) && (
                      <div className="flex flex-col items-end">
                        <span className="text-gray-500">Fin:</span>
                        <span className="text-red-600 font-medium">
                          {format(date.to, "dd MMM yy", { locale: es })}
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
              disabled={
                !date?.from ||
                !date?.to ||
                !isValid(date.from) ||
                !isValid(date.to)
              }
            >
              Aplicar rango
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
