
"use client";

import type { Task } from "@/lib/types";
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
import { format, eachDayOfInterval } from "date-fns";
import { updateTaskConsumption } from "@/lib/actions";

interface DailyConsumptionTrackerProps {
  task: Task;
}

const formatCurrency = (value: number) => new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format(value);


export function DailyConsumptionTracker({ task }: DailyConsumptionTrackerProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [consumptions, setConsumptions] = useState<Record<string, number>>(
    (task.dailyConsumption || []).reduce((acc, curr) => {
      acc[format(new Date(curr.date), "yyyy-MM-dd")] = curr.consumedQuantity;
      return acc;
    }, {} as Record<string, number>)
  );

  const handleConsumptionChange = (date: string, value: string) => {
    const newConsumptions = { ...consumptions };
    if (value === "") {
        delete newConsumptions[date];
    } else {
        const numericValue = Number(value);
        if (!isNaN(numericValue) && numericValue >= 0) {
            newConsumptions[date] = numericValue;
        }
    }
    setConsumptions(newConsumptions);
  };

  const handleSave = (date: string) => {
    const consumedQuantity = consumptions[date] || 0;
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
            "PPP"
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

  const dates = eachDayOfInterval({
    start: new Date(task.startDate),
    end: new Date(task.endDate),
  });

  return (
    <div className="p-4 bg-muted/50 rounded-md">
      <h4 className="font-semibold mb-2 text-base">Desglose de Consumo Diario</h4>
      <div className="max-h-60 overflow-y-auto">
        <Table>
            <TableHeader className="sticky top-0 bg-muted">
            <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Cant. Registrada</TableHead>
                <TableHead>Valor Consumido</TableHead>
                <TableHead className="w-[100px] text-right">Acción</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {dates.map((date) => {
                const dateString = format(date, "yyyy-MM-dd");
                const consumedQuantity = consumptions[dateString] ?? 0;
                const consumedValue = consumedQuantity * task.value;
                return (
                <TableRow key={dateString}>
                    <TableCell>{format(date, "PPP")}</TableCell>
                    <TableCell>
                      <Input
                          type="number"
                          value={consumedQuantity}
                          onChange={(e) =>
                            handleConsumptionChange(dateString, e.target.value)
                          }
                          placeholder="0"
                          className="h-8"
                          disabled={isPending}
                      />
                    </TableCell>
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
