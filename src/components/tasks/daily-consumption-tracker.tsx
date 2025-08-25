
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
import { format, parse } from "date-fns";
import { es } from "date-fns/locale";
import { updateTaskConsumption } from "@/lib/actions";
import { formatCurrency } from "@/lib/utils";
import { useSession } from "@/hooks/use-session";
import { Textarea } from "../ui/textarea";
import { Loader2, Save } from "lucide-react";


interface DailyConsumptionTrackerProps {
  task: Task;
  onSuccess: () => void;
}


export function DailyConsumptionTracker({ task, onSuccess }: DailyConsumptionTrackerProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const { session } = useSession();
  const isManager = session.user?.isManager ?? false;

  const [consumptions, setConsumptions] = useState<DailyConsumption[]>(
    task.dailyConsumption || []
  );

  const handleInputChange = (dateString: string, field: keyof DailyConsumption, value: string | number) => {
    setConsumptions(prevConsumptions =>
        prevConsumptions.map(c => {
            const d = new Date(c.date);
            const userTimezoneOffset = d.getTimezoneOffset() * 60000;
            const adjustedDate = new Date(d.getTime() + userTimezoneOffset);

            if (format(adjustedDate, 'yyyy-MM-dd') === dateString) {
                return { ...c, [field]: value };
            }
            return c;
        })
    );
  };
  
  const handleSave = (day: DailyConsumption) => {
    startTransition(async () => {
      try {
        const dateString = format(adjustDateForDisplay(day.date), "yyyy-MM-dd");
        await updateTaskConsumption(
          task.id,
          dateString,
          day.consumedQuantity,
          day.verifiedQuantity,
          day.details
        );
        
        toast({
          title: "Consumo Guardado",
          description: `El consumo para el ${format(adjustDateForDisplay(day.date), "PPP", { locale: es })} ha sido actualizado.`,
        });
        onSuccess();
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
      <div className="max-h-80 overflow-y-auto">
        <Table>
            <TableHeader className="sticky top-0 bg-muted z-10">
            <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Cant. Planificada</TableHead>
                <TableHead>Cant. Registrada</TableHead>
                <TableHead>Cant. Verificada</TableHead>
                {isManager && <TableHead>Costo Consumido</TableHead>}
                {isManager && <TableHead>Valor Consumido</TableHead>}
                <TableHead>Detalle</TableHead>
                <TableHead className="w-[100px] text-right">Acción</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {consumptions.map((consumptionDay) => {
                const displayDate = adjustDateForDisplay(consumptionDay.date);
                const dateString = format(displayDate, "yyyy-MM-dd");
                const consumedCost = consumptionDay.consumedQuantity * task.cost;
                const consumedValue = consumptionDay.consumedQuantity * task.precio;
                
                return (
                <TableRow key={dateString}>
                    <TableCell>{format(displayDate, "PPP", { locale: es })}</TableCell>
                    <TableCell className="font-mono">{consumptionDay.plannedQuantity.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    <TableCell>
                      <Input
                          type="number"
                          value={consumptionDay.consumedQuantity}
                          onChange={(e) => handleInputChange(dateString, 'consumedQuantity', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="h-8 w-32"
                          disabled={isPending}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                          type="number"
                          value={consumptionDay.verifiedQuantity}
                           onChange={(e) => handleInputChange(dateString, 'verifiedQuantity', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="h-8 w-32"
                          disabled={isPending}
                      />
                    </TableCell>
                    {isManager && (
                        <TableCell className="font-mono">
                          {formatCurrency(consumedCost)}
                        </TableCell>
                    )}
                    {isManager && (
                        <TableCell className="font-mono">
                          {formatCurrency(consumedValue)}
                        </TableCell>
                    )}
                    <TableCell>
                       <Textarea
                          value={consumptionDay.details}
                          onChange={(e) => handleInputChange(dateString, 'details', e.target.value)}
                          placeholder="Añadir detalle..."
                          className="h-8 min-h-8 w-40"
                          disabled={isPending}
                        />
                    </TableCell>
                    <TableCell className="text-right">
                    <Button 
                        size="icon" 
                        variant="default"
                        onClick={() => handleSave(consumptionDay)}
                        disabled={isPending}
                        className="h-8 w-8 bg-black hover:bg-black/80 text-white"
                    >
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        <span className="sr-only">Guardar</span>
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
