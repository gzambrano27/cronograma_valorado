
"use client";

import type { DailyConsumption, Task } from "@/lib/types";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { updateTaskConsumption } from "@/lib/actions";
import { formatCurrency } from "@/lib/utils";


interface DailyConsumptionTrackerProps {
  task: Task;
}


export function DailyConsumptionTracker({ task }: DailyConsumptionTrackerProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  // Initialize local state from the pre-generated dailyConsumption array
  const [consumptions, setConsumptions] = useState<DailyConsumption[]>(
    task.dailyConsumption || []
  );

  const handleConsumptionChange = (dateString: string, value: string) => {
    const numericValue = value === "" ? 0 : Number(value);
    if (isNaN(numericValue)) return; // Ignore non-numeric input

    setConsumptions(prevConsumptions => 
        prevConsumptions.map(c => {
            // Adjust date for comparison to avoid timezone issues
            const d = new Date(c.date);
            const userTimezoneOffset = d.getTimezoneOffset() * 60000;
            const adjustedDate = new Date(d.getTime() + userTimezoneOffset);

            if (format(adjustedDate, 'yyyy-MM-dd') === dateString) {
                return { ...c, consumedQuantity: numericValue };
            }
            return c;
        })
    );
  };
  
  const handleSave = (date: string) => {
    const consumptionEntry = consumptions.find(c => {
        const d = new Date(c.date);
        const userTimezoneOffset = d.getTimezoneOffset() * 60000;
        const adjustedDate = new Date(d.getTime() + userTimezoneOffset);
        return format(adjustedDate, 'yyyy-MM-dd') === date;
    });

    const consumedQuantity = consumptionEntry?.consumedQuantity ?? 0;

    startTransition(async () => {
      try {
        await updateTaskConsumption(task.id, date, consumedQuantity);

        const displayDate = new Date(date);
        const userTimezoneOffset = displayDate.getTimezoneOffset() * 60000;
        const correctedDate = new Date(displayDate.getTime() + userTimezoneOffset);

        toast({
          title: "Consumo Guardado",
          description: `El consumo para el ${format(
            correctedDate,
            "PPP", { locale: es }
          )} ha sido actualizado.`,
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo guardar el consumo.",
        });
      }
    });
  };
  
  const adjustDateForDisplay = (date: Date): Date => {
      const d = new Date(date);
      const userTimezoneOffset = d.getTimezoneOffset() * 60000;
      return new Date(d.getTime() + userTimezoneOffset);
  }

  return (
    <div className="p-4 bg-muted/50 rounded-md">
      <h4 className="font-semibold mb-2 text-base">Desglose de Consumo Diario</h4>
      <div className="max-h-60 overflow-y-auto">
        <Table>
            <TableHeader className="sticky top-0 bg-muted">
            <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Cant. Planificada</TableHead>
                <TableHead>Cant. Registrada</TableHead>
                <TableHead>Diferencia</TableHead>
                <TableHead>Valor Consumido</TableHead>
                <TableHead className="w-[100px] text-right">Acción</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {consumptions.map((consumptionDay) => {
                const displayDate = adjustDateForDisplay(consumptionDay.date);
                const dateString = format(displayDate, "yyyy-MM-dd");
                const consumedValue = consumptionDay.consumedQuantity * task.value;
                const difference = consumptionDay.consumedQuantity - consumptionDay.plannedQuantity;
                
                return (
                <TableRow key={dateString}>
                    <TableCell>{format(displayDate, "PPP", { locale: es })}</TableCell>
                    <TableCell className="font-mono">{consumptionDay.plannedQuantity.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    <TableCell>
                      <Input
                          type="number"
                          value={consumptionDay.consumedQuantity}
                          onChange={(e) =>
                            handleConsumptionChange(dateString, e.target.value)
                          }
                          placeholder="0"
                          className="h-8 w-32"
                          disabled={isPending}
                      />
                    </TableCell>
                    <TableCell className="font-mono">{difference.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    <TableCell className="font-mono">
                      {formatCurrency(consumedValue)}
                    </TableCell>
                    <TableCell className="text-right">
                    <Button 
                        size="sm" 
                        onClick={() => handleSave(dateString)}
                        disabled={isPending}
                    >
                        {isPending ? "..." : "Guardar"}
                    </Button>
                    </TableCell>
                </TableRow>
                );
            })}
            </TableBody>
        </Table>
      </div>
    </div>
  );
}

    
