"use client";

import type { Task } from "@/lib/types";
import { useState } from "react";
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
import { format, differenceInCalendarDays } from "date-fns";

interface DailyConsumptionTrackerProps {
  task: Task;
}

export function DailyConsumptionTracker({ task }: DailyConsumptionTrackerProps) {
  const { toast } = useToast();

  const adjustDateForTimezone = (date: Date | string): Date => {
    const d = new Date(date);
    const userTimezoneOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() + userTimezoneOffset);
  };

  const [consumptions, setConsumptions] = useState<Record<string, number>>(
    (task.dailyConsumption || []).reduce((acc, curr) => {
      acc[format(adjustDateForTimezone(curr.date), "yyyy-MM-dd")] = curr.consumedQuantity;
      return acc;
    }, {} as Record<string, number>)
  );

  const handleConsumptionChange = (date: string, value: string) => {
    const newConsumptions = { ...consumptions };
    const numericValue = Number(value);
    if (!isNaN(numericValue) && numericValue >= 0) {
      newConsumptions[date] = numericValue;
      setConsumptions(newConsumptions);
    }
  };

  const handleSave = (date: string) => {
    toast({
      title: "Consumo Guardado",
      description: `El consumo para el ${format(
        adjustDateForTimezone(date),
        "PPP"
      )} ha sido guardado.`,
    });
  };

  const getDates = (startDate: Date, endDate: Date) => {
    const dates = [];
    let currentDate = adjustDateForTimezone(startDate);
    const finalDate = adjustDateForTimezone(endDate);
    
    while (currentDate <= finalDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
  };

  const dates = getDates(task.startDate, task.endDate);
  
  const adjustedStartDate = adjustDateForTimezone(task.startDate);
  const adjustedEndDate = adjustDateForTimezone(task.endDate);
  const durationInDays = differenceInCalendarDays(adjustedEndDate, adjustedStartDate) + 1;
  const dailyPlannedQuantity = durationInDays > 0 ? task.quantity / durationInDays : 0;


  return (
    <div className="p-4 bg-muted/50 rounded-md">
      <h4 className="font-semibold mb-2 text-base">Desglose de Consumo Diario</h4>
      <div className="max-h-60 overflow-y-auto">
        <Table>
            <TableHeader className="sticky top-0 bg-muted">
            <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Cant. Planificada</TableHead>
                <TableHead className="w-[180px]">Consumo Registrado</TableHead>
                <TableHead className="w-[100px] text-right">Acción</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {dates.map((date) => {
                const dateString = format(date, "yyyy-MM-dd");
                return (
                <TableRow key={dateString}>
                    <TableCell>{format(date, "PPP")}</TableCell>
                    <TableCell>{dailyPlannedQuantity.toFixed(2)}</TableCell>
                    <TableCell>
                    <Input
                        type="number"
                        value={consumptions[dateString] || ""}
                        onChange={(e) =>
                        handleConsumptionChange(dateString, e.target.value)
                        }
                        placeholder="0"
                        className="h-8"
                    />
                    </TableCell>
                    <TableCell className="text-right">
                    <Button size="sm" onClick={() => handleSave(dateString)}>
                        Guardar
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
