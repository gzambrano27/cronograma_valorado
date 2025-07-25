
"use client";

import { useState, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Partner, Task } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateTaskPartner } from "@/lib/actions";
import { Loader2 } from "lucide-react";

interface PartnerCellProps {
  task: Task;
  allPartners: Partner[];
  onSuccess: () => void;
}

export function PartnerCell({ task, allPartners, onSuccess }: PartnerCellProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handlePartnerChange = (partnerId: string) => {
    const newPartnerId = partnerId ? Number(partnerId) : null;
    startTransition(async () => {
      const result = await updateTaskPartner(task.id, newPartnerId);
      if (result.success) {
        toast({
          title: "Proveedor Actualizado",
          description: "El proveedor de la tarea ha sido actualizado.",
        });
        onSuccess();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message || "No se pudo actualizar el proveedor.",
        });
      }
    });
  };
  
  return (
    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
      <Select
        defaultValue={task.partnerId?.toString()}
        onValueChange={handlePartnerChange}
        disabled={isPending}
      >
        <SelectTrigger className="h-8 w-[200px] border-0 bg-transparent shadow-none hover:bg-muted focus:ring-1 focus:ring-ring">
            <SelectValue placeholder="Asignar proveedor" />
        </SelectTrigger>
        <SelectContent>
            <SelectItem value="">Sin Asignar</SelectItem>
            {allPartners.map((partner) => (
                <SelectItem key={partner.id} value={String(partner.id)}>
                    {partner.name}
                </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  );
}
