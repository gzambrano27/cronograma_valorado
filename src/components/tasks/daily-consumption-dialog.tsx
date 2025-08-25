
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Task } from "@/lib/types";
import { DailyConsumptionTracker } from "./daily-consumption-tracker";
import { Button } from "../ui/button";

interface DailyConsumptionDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DailyConsumptionDialog({
  task,
  open,
  onOpenChange,
  onSuccess,
}: DailyConsumptionDialogProps) {

  if (!task) {
    return null;
  }

  const handleSuccess = () => {
    onSuccess();
    // No cerramos el modal para que el usuario pueda seguir editando.
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-5xl">
        <DialogHeader>
          <DialogTitle className="font-headline">Desglose de Consumo Diario: {task.name}</DialogTitle>
          <DialogDescription>
            Registre y verifique las cantidades consumidas para cada día planificado de la tarea.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 max-h-[70vh] overflow-y-auto">
          <DailyConsumptionTracker task={task} onSuccess={handleSuccess} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
