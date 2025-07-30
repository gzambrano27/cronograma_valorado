
"use client";

import { useState, useTransition, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Partner, Task } from "@/lib/types";
import { updateTaskPartner } from "@/lib/actions";
import { Loader2, ChevronsUpDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface PartnerCellProps {
  task: Task;
  allPartners: Partner[];
  onSuccess: () => void;
}

export function PartnerCell({ task, allPartners, onSuccess }: PartnerCellProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [currentValue, setCurrentValue] = useState(task.partnerId?.toString() ?? "null");

  const handlePartnerChange = (partnerIdString: string) => {
    setOpen(false);
    
    // Si no hay cambio, no hacer nada.
    if (partnerIdString === currentValue) return;

    setCurrentValue(partnerIdString);
    const newPartnerId = partnerIdString === "null" ? null : Number(partnerIdString);

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
        // Revertir el valor en caso de error
        setCurrentValue(task.partnerId?.toString() ?? "null");
      }
    });
  };

  const selectedPartnerName = useMemo(() => {
    if (currentValue === "null") {
      return "Sin Asignar";
    }
    const partner = allPartners.find(p => p.id.toString() === currentValue);
    return partner?.name ?? "Asignar proveedor";
  }, [currentValue, allPartners]);

  return (
    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            role="combobox"
            aria-expanded={open}
            className="h-8 w-[200px] justify-between px-2 font-normal border-0 bg-transparent shadow-none hover:bg-muted focus:ring-1 focus:ring-ring disabled:opacity-100"
            disabled={isPending}
          >
            <span className="truncate">{selectedPartnerName}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[250px] p-0">
          <Command>
            <CommandInput placeholder="Buscar proveedor..." />
            <CommandList>
                <CommandEmpty>No se encontró el proveedor.</CommandEmpty>
                <CommandGroup>
                    <CommandItem
                        value="null"
                        onSelect={() => handlePartnerChange("null")}
                    >
                        <Check
                            className={cn(
                            "mr-2 h-4 w-4",
                            currentValue === "null" ? "opacity-100" : "opacity-0"
                            )}
                        />
                        Sin Asignar
                    </CommandItem>
                    {allPartners.map((partner) => (
                        <CommandItem
                            key={partner.id}
                            value={partner.name} // Usamos el nombre para la búsqueda
                            onSelect={() => handlePartnerChange(partner.id.toString())}
                        >
                            <Check
                                className={cn(
                                "mr-2 h-4 w-4",
                                currentValue === partner.id.toString() ? "opacity-100" : "opacity-0"
                                )}
                            />
                            {partner.name}
                        </CommandItem>
                    ))}
                </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
