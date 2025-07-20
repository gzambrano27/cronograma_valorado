
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
import { UploadCloud, MapPin, Loader2, X } from "lucide-react";
import React, { useState, useRef, useCallback } from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "../ui/skeleton";
import dynamic from "next/dynamic";

// Dynamic import for MapPicker to disable SSR, which prevents the "window is not defined" error.
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
  const { toast } = useToast();
  const hasValidations = task.validations && task.validations.length > 0;

  const handleLocationSelect = useCallback((loc: { lat: number; lng: number }) => {
    setLocation(`${loc.lat.toFixed(6)}, ${loc.lng.toFixed(6)}`);
  }, []);

  const handleLocationError = useCallback((message: string) => {
    toast({
        variant: "destructive",
        title: "Error de Ubicación",
        description: message,
    });
  }, [toast]);

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
  
  const clearImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }

  const action = async (formData: FormData) => {
    try {
      await validateTask(formData);
      toast({
          title: "Tarea Validada",
          description: "La imagen y ubicación han sido guardadas.",
      });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
       toast({
        variant: "destructive",
        title: "Error al validar",
        description: error.message || "No se pudo guardar la validación.",
      });
    }
  };
  

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) {
            // Reset state when closing
            clearImage();
            setLocation(null);
        }
    }}>
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
            <input type="hidden" name="taskId" value={task.id} />
            <input type="hidden" name="projectId" value={task.projectId} />
            {location && <input type="hidden" name="location" value={location} />}

            <div className="space-y-2">
                <Label htmlFor="image">Imagen de Evidencia</Label>
                <div className="relative flex items-center justify-center w-full h-48 border-2 border-dashed rounded-lg group hover:bg-muted">
                    <Input ref={fileInputRef} id="image" name="image" type="file" accept="image/*" className="absolute w-full h-full opacity-0 cursor-pointer" onChange={handleImageChange} required={!imagePreview} />
                    {imagePreview ? (
                       <>
                        <Image src={imagePreview} alt="Previsualización" fill style={{objectFit: "contain"}} className="rounded-lg p-1" />
                         <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 z-10 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={clearImage}>
                            <X className="h-4 w-4" />
                            <span className="sr-only">Cambiar imagen</span>
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
             <SubmitButton disabled={!location || !imagePreview} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
