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
import { CalendarIcon, Plus, UploadCloud, MapPin } from "lucide-react"
import { Textarea } from "../ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Calendar } from "../ui/calendar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import React, { useEffect, useRef } from "react"
import { useToast } from "@/hooks/use-toast"
import { useFormState, useFormStatus } from "react-dom"
import { createTask } from "@/lib/actions"

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? "Guardando..." : "Guardar Tarea"}
        </Button>
    );
}

export function AddTaskSheet({ projectId }: { projectId: string }) {
  const [open, setOpen] = React.useState(false)
  const { toast } = useToast()
  const formRef = useRef<HTMLFormElement>(null);

  const [startDate, setStartDate] = React.useState<Date>()
  const [endDate, setEndDate] = React.useState<Date>()

  const createTaskWithProjectId = createTask.bind(null, projectId);

  const [state, formAction] = useFormState(async (_prevState: any, formData: FormData) => {
    // Add dates to formData
    if (startDate) {
        formData.set('startDate', format(startDate, 'yyyy-MM-dd'));
    }
    if (endDate) {
        formData.set('endDate', format(endDate, 'yyyy-MM-dd'));
    }

    try {
      await createTaskWithProjectId(formData);
      toast({
        title: "Tarea Creada",
        description: "La nueva tarea ha sido añadida al cronograma.",
      });
      setOpen(false);
      return { success: true, message: "Tarea creada." };
    } catch (error: any) {
      return { success: false, message: error.message || "No se pudo crear la tarea." };
    }
  }, { message: '', success: false });

  useEffect(() => {
    if (state.message && !state.success) {
      toast({
        variant: "destructive",
        title: "Error al crear la tarea",
        description: state.message,
      });
    }
  }, [state, toast]);

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
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="quantity">Cantidad</Label>
                        <Input id="quantity" name="quantity" type="number" placeholder="100" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="value">Valor</Label>
                        <Input id="value" name="value" type="number" placeholder="50000" required />
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
                 <div className="space-y-2">
                    <Label htmlFor="location">Ubicación</Label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                        <Input id="location" name="location" placeholder="Ej: Sector A-1, Km 5" className="pl-10" required />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="image-upload">Validación Visual (Opcional)</Label>
                    <div className="relative flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted">
                        <Input id="image-upload" name="image" type="file" className="absolute w-full h-full opacity-0 cursor-pointer" />
                        <div className="text-center">
                            <UploadCloud className="w-8 h-8 mx-auto text-muted-foreground" />
                            <p className="mt-2 text-sm text-muted-foreground">Arrastra y suelta o haz clic para subir</p>
                            <p className="text-xs text-muted-foreground">PNG, JPG (MAX. 5MB)</p>
                        </div>
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
