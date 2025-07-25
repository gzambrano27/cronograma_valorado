
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
import { CalendarIcon, Plus } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Calendar } from "../ui/calendar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import React, { useEffect, useRef, useActionState, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { useFormStatus } from "react-dom"
import { createTask } from "@/lib/actions"
import { getPartners } from "@/lib/data"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import type { Partner } from "@/lib/types"

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
  const [partners, setPartners] = useState<Partner[]>([]);

  const [startDate, setStartDate] = React.useState<Date>()
  const [endDate, setEndDate] = React.useState<Date>()

  useEffect(() => {
    async function loadPartners() {
        if(open) {
            const fetchedPartners = await getPartners();
            setPartners(fetchedPartners);
        }
    }
    loadPartners();
  }, [open]);

  const createTaskWithSuccess = async (_prevState: any, formData: FormData) => {
    if (startDate) {
        formData.set('startDate', format(startDate, 'yyyy-MM-dd'));
    }
    if (endDate) {
        formData.set('endDate', format(endDate, 'yyyy-MM-dd'));
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
    }
  }, [open]);

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
                    <Select name="partnerId">
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccione un proveedor" />
                        </SelectTrigger>
                        <SelectContent>
                           {partners.map(partner => (
                               <SelectItem key={partner.id} value={String(partner.id)}>
                                   {partner.name}
                               </SelectItem>
                           ))}
                        </SelectContent>
                    </Select>
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
