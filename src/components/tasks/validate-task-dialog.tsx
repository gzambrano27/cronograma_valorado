
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validateTask } from "@/lib/actions";
import type { Task } from "@/lib/types";
import { UploadCloud, MapPin, Loader2, X, RotateCw } from "lucide-react";
import React, { useState, useRef, useCallback, useEffect } from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "../ui/skeleton";
import dynamic from "next/dynamic";
import { useSession } from "@/hooks/use-session";

// Importación dinámica del componente de mapa para evitar errores de SSR,
// ya que depende de objetos del navegador como `window`.
const MapPicker = dynamic(
  () => import("./map-picker").then((mod) => mod.MapPicker),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[300px] w-full" />,
  }
);


function SubmitButton({ disabled }: { disabled: boolean }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending || disabled}>
            {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</> : "Guardar Validación"}
        </Button>
    );
}

/**
 * Diálogo para validar una tarea subiendo una imagen y registrando una ubicación.
 */
export function ValidateTaskDialog({
  task,
  open,
  onOpenChange,
  onSuccess,
}: {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { session } = useSession();
  const hasValidations = task.validations && task.validations.length > 0;
  const userId = session.user?.id;

  // Callback para manejar la selección de ubicación desde el mapa.
  const handleLocationSelect = useCallback((loc: { lat: number; lng: number }) => {
    setLocation(`${loc.lat.toFixed(6)}, ${loc.lng.toFixed(6)}`);
  }, []);

  // Callback para manejar errores de geolocalización.
  const handleLocationError = useCallback((message: string) => {
    toast({
        variant: "destructive",
        title: "Error de Ubicación",
        description: message,
    });
  }, [toast]);

  // Maneja el cambio del input de archivo para generar una previsualización.
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Limpia la imagen seleccionada.
  const clearImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }

  // Llama a la acción del servidor para guardar la validación.
  const action = async (formData: FormData) => {
    if (!userId) {
        toast({ variant: "destructive", title: "Error", description: "No se pudo identificar al usuario." });
        return;
    }
    setIsSubmitting(true);
    try {
      await validateTask(formData);
      toast({
          title: "Tarea Validada",
          description: "La imagen y la ubicación han sido guardadas correctamente.",
      });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
       toast({
        variant: "destructive",
        title: "Error al validar",
        description: error.message || "No se pudo guardar la validación.",
      });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  // Resetea el estado del formulario al cerrarse.
  const handleOpenChange = (isOpen: boolean) => {
      onOpenChange(isOpen);
      if (!isOpen) {
          clearImage();
          setLocation(null);
      }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form ref={formRef} action={action}>
          <DialogHeader>
            <DialogTitle className="font-headline">
              {hasValidations ? 'Añadir Nueva Validación' : 'Validar Tarea'}: {task.name}
            </DialogTitle>
            <DialogDescription>
              Sube una imagen de evidencia y selecciona la ubicación en el mapa.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Inputs ocultos para enviar datos adicionales con el formulario */}
            <input type="hidden" name="taskId" value={task.id} />
            <input type="hidden" name="projectId" value={task.projectId} />
            {userId && <input type="hidden" name="userId" value={userId} />}
            {location && <input type="hidden" name="location" value={location} />}

            <div className="space-y-2">
                <Label htmlFor="image">Imagen de Evidencia</Label>
                <div className="relative flex items-center justify-center w-full h-48 border-2 border-dashed rounded-lg group hover:bg-muted transition-colors">
                    <Input ref={fileInputRef} id="image" name="image" type="file" accept="image/*" className="absolute w-full h-full opacity-0 cursor-pointer z-10" onChange={handleImageChange} required={!imagePreview} />
                    {imagePreview ? (
                       <>
                        <Image src={imagePreview} alt="Previsualización de la imagen" fill style={{objectFit: "contain"}} className="rounded-lg p-1" />
                         <Button type="button" variant="secondary" size="sm" className="absolute top-2 right-2 z-20 h-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => fileInputRef.current?.click()}>
                            <RotateCw className="h-4 w-4 mr-2" />
                            Cambiar
                        </Button>
                       </>
                    ) : (
                        <div className="text-center pointer-events-none">
                            <UploadCloud className="w-8 h-8 mx-auto text-muted-foreground" />
                            <p className="mt-2 text-sm text-muted-foreground">Arrastra y suelta o haz clic para subir</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-2">
                <Label>Ubicación</Label>
                 <div className="h-[300px] w-full rounded-md border overflow-hidden">
                     <MapPicker onLocationSelect={handleLocationSelect} onLocationError={handleLocationError} />
                 </div>
                 {location ? (
                    <div className="flex items-center gap-2 p-2 mt-2 border rounded-md bg-muted">
                        <MapPin className="h-5 w-5 text-primary" />
                        <span className="text-sm font-mono text-muted-foreground">{location}</span>
                    </div>
                 ) : (
                    <div className="flex items-center gap-2 p-2 mt-2 border rounded-md bg-muted/80">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Seleccione una ubicación en el mapa...</span>
                    </div>
                 )}
            </div>
          </div>
          <DialogFooter>
             <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
             <SubmitButton disabled={!location || !imagePreview || isSubmitting} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
