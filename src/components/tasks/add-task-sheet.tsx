
"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { CalendarIcon, Plus, Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Calendar } from "../ui/calendar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import React, { useEffect, useRef, useActionState, useState, useTransition } from "react"
import { useToast } from "@/hooks/use-toast"
import { useFormStatus } from "react-dom"
import { createTask } from "@/lib/actions"
import { getPartners } from "@/lib/data"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import type { Partner } from "@/lib/types"
import { useDebounce } from "@/hooks/use-debounce"

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? "Guardando..." : "Guardar Tarea"}
        </Button>
    );
}

export function AddTaskSheet({ projectId, onSuccess }: { projectId: number, onSuccess: () => void }) {
  const [open, setOpen] = React.useState(false)
  const { toast } = useToast()
  const formRef = useRef<HTMLFormElement>(null);

  const [partnerComboboxOpen, setPartnerComboboxOpen] = useState(false)
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

  const [partners, setPartners] = useState<Partner[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [isPartnerLoading, startPartnerLoading] = useTransition();


  const [startDate, setStartDate] = React.useState<Date>()
  const [endDate, setEndDate] = React.useState<Date>()

  useEffect(() => {
    if (debouncedSearch || partnerComboboxOpen) {
        startPartnerLoading(async () => {
            const fetchedPartners = await getPartners(debouncedSearch);
            setPartners(fetchedPartners);
        });
    } else {
        setPartners([]);
    }
  }, [debouncedSearch, partnerComboboxOpen]);

  const createTaskWithSuccess = async (_prevState: any, formData: FormData) => {
    if (startDate) {
        formData.set('startDate', format(startDate, 'yyyy-MM-dd'));
    }
    if (endDate) {
        formData.set('endDate', format(endDate, 'yyyy-MM-dd'));
    }
    if (selectedPartner) {
        formData.set('partnerId', String(selectedPartner.id));
    }

    const result = await createTask(projectId, formData);
    return result;
  };


  const [state, formAction] = useActionState(createTaskWithSuccess, { success: false, message: null });

  useEffect(() => {
    if (state.success) {
      toast({
        title: "Tarea Creada",
        description: "La nueva tarea ha sido añadida al cronograma.",
      });
      onSuccess(); // Vuelve a cargar los datos en la página principal
      setOpen(false);
    } else if (state.message) {
      toast({
        variant: "destructive",
        title: "Error al crear la tarea",
        description: state.message,
      });
    }
  }, [state, toast, onSuccess]);


  useEffect(() => {
    if (!open) {
      formRef.current?.reset();
      setStartDate(undefined);
      setEndDate(undefined);
      setSelectedPartner(null);
      setSearchQuery("");
    }
  }, [open]);

  const selectedPartnerName = selectedPartner?.name ?? "Seleccione un proveedor";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
            <Plus className="mr-2 h-4 w-4"/>
            Añadir Tarea
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <form ref={formRef} action={formAction}>
            <SheetHeader>
            <SheetTitle className="font-headline">Añadir Nueva Tarea</SheetTitle>
            <SheetDescription>
                Complete los detalles para la nueva tarea del proyecto.
            </SheetDescription>
            </SheetHeader>
            <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Nombre de la Tarea</Label>
                    <Input id="name" name="name" placeholder="Ej: Vaciado de hormigón" required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="partnerId">Proveedor/Responsable</Label>
                     <Popover open={partnerComboboxOpen} onOpenChange={setPartnerComboboxOpen}>
                        <PopoverTrigger asChild>
                            <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={partnerComboboxOpen}
                            className="w-full justify-between font-normal"
                            >
                            <span className="truncate">{selectedPartnerName}</span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                                <CommandInput
                                    placeholder="Buscar proveedor..."
                                    value={searchQuery}
                                    onValueChange={setSearchQuery}
                                />
                                <CommandList>
                                    {isPartnerLoading && (
                                        <div className="p-2 flex justify-center items-center">
                                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground"/>
                                        </div>
                                    )}
                                    {!isPartnerLoading && partners.length === 0 && (
                                        <CommandEmpty>No se encontró ningún proveedor.</CommandEmpty>
                                    )}
                                    <CommandGroup>
                                        <CommandItem
                                            key="no-partner"
                                            value="null"
                                            onSelect={() => {
                                                setSelectedPartner(null)
                                                setPartnerComboboxOpen(false)
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                "mr-2 h-4 w-4",
                                                !selectedPartner ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            Sin Asignar
                                        </CommandItem>
                                        {partners.map((partner) => (
                                            <CommandItem
                                                key={partner.id}
                                                value={partner.name}
                                                onSelect={() => {
                                                    setSelectedPartner(partner);
                                                    setPartnerComboboxOpen(false);
                                                }}
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
                    <input type="hidden" name="partnerId" value={selectedPartner?.id ?? ""} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="quantity">Cantidad</Label>
                    <Input id="quantity" name="quantity" type="number" placeholder="100" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="cost">Costo</Label>
                        <Input id="cost" name="cost" type="number" placeholder="400" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="precio">Precio (PVP)</Label>
                        <Input id="precio" name="precio" type="number" placeholder="500" required />
                    </div>
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Fecha de Inicio</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !startDate && "text-muted-foreground"
                                )}
                                >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {startDate ? format(startDate, "PPP", { locale: es }) : <span>Elegir fecha</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="space-y-2">
                        <Label>Fecha de Fin</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !endDate && "text-muted-foreground"
                                )}
                                >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {endDate ? format(endDate, "PPP", { locale: es }) : <span>Elegir fecha</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            </div>
            <SheetFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <SubmitButton />
            </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

