
"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
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
import { getPartners } from "@/lib/data";
import { useDebounce } from "@/hooks/use-debounce";

interface PartnerCellProps {
  task: Task;
  onSuccess: () => void;
}

export function PartnerCell({ task, onSuccess }: PartnerCellProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>({
      id: task.partnerId,
      name: task.partnerName,
  });

  const [partners, setPartners] = useState<Partner[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [isLoading, startLoading] = useTransition();


  useEffect(() => {
    // Si el popover está abierto, iniciamos la carga de datos.
    // Si hay una búsqueda, la usamos, de lo contrario cargamos la lista inicial.
    if (open) {
        startLoading(async () => {
            const fetchedPartners = await getPartners(debouncedSearch);
            setPartners(fetchedPartners);
        });
    }
  }, [debouncedSearch, open]);


  const handlePartnerChange = (partner: Partner | null) => {
    setOpen(false);
    
    if (partner?.id === selectedPartner?.id) return;

    setSelectedPartner(partner);

    startTransition(async () => {
      const result = await updateTaskPartner(task.id, partner?.id ?? null);
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
         setSelectedPartner({ id: task.partnerId, name: task.partnerName });
      }
    });
  };
  
  const selectedPartnerName = useMemo(() => {
    return selectedPartner?.name || "Sin Asignar";
  }, [selectedPartner]);


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
            <CommandInput
                placeholder="Buscar proveedor..."
                value={searchQuery}
                onValueChange={setSearchQuery}
            />
            <CommandList>
                {isLoading && (
                    <div className="p-2 flex justify-center items-center">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground"/>
                    </div>
                )}
                {!isLoading && partners.length === 0 && searchQuery && (
                    <CommandEmpty>No se encontró el proveedor.</CommandEmpty>
                )}
                <CommandGroup>
                    <CommandItem
                        value="null"
                        onSelect={() => handlePartnerChange(null)}
                    >
                        <Check
                            className={cn(
                            "mr-2 h-4 w-4",
                            !selectedPartner?.id ? "opacity-100" : "opacity-0"
                            )}
                        />
                        Sin Asignar
                    </CommandItem>
                    {partners.map((partner) => (
                        <CommandItem
                            key={partner.id}
                            value={partner.name}
                            onSelect={() => handlePartnerChange(partner)}
                        >
                            <Check
                                className={cn(
                                "mr-2 h-4 w-4",
                                selectedPartner?.id === partner.id ? "opacity-100" : "opacity-0"
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
