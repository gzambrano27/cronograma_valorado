
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
import { UploadCloud, MapPin, Loader2 } from "lucide-react";
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
}: {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { toast } = useToast();

  const handleLocationSelect = useCallback((loc: { lat: number; lng: number }) => {
    setLocation(`${loc.lat.toFixed(6)}, ${loc.lng.toFixed(6)}`);
  }, []);

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

  const action = async (formData: FormData) => {
    try {
      await validateTask(formData);
      toast({
          title: "Tarea Validada",
          description: "La imagen y ubicación han sido guardadas.",
      });
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
            setImagePreview(null);
            setLocation(null);
        }
    }}>
      <DialogContent className="sm:max-w-md">
        <form ref={formRef} action={action}>
          <DialogHeader>
            <DialogTitle className="font-headline">Validar Tarea: {task.name}</DialogTitle>
            <DialogDescription>
              Sube una imagen de evidencia. La ubicación se detectará automáticamente.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <input type="hidden" name="taskId" value={task.id} />
            <input type="hidden" name="projectId" value={task.projectId} />
            {location && <input type="hidden" name="location" value={location} />}

            <div className="space-y-2">
                <Label htmlFor="image">Imagen de Evidencia</Label>
                <div className="relative flex items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted">
                    <Input id="image" name="image" type="file" accept="image/*" className="absolute w-full h-full opacity-0 cursor-pointer" onChange={handleImageChange} required />
                    {imagePreview ? (
                        <Image src={imagePreview} alt="Previsualización" fill objectFit="contain" className="rounded-lg p-1" />
                    ) : (
                        <div className="text-center">
                            <UploadCloud className="w-8 h-8 mx-auto text-muted-foreground" />
                            <p className="mt-2 text-sm text-muted-foreground">Arrastra y suelta o haz clic para subir</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-2">
                <Label>Ubicación</Label>
                 <div className="h-[300px] w-full rounded-md border overflow-hidden">
                     <MapPicker onLocationSelect={handleLocationSelect} />
                 </div>
                 {location ? (
                    <div className="flex items-center gap-2 p-2 mt-2 border rounded-md bg-muted">
                        <MapPin className="h-5 w-5 text-primary" />
                        <span className="text-sm font-mono text-muted-foreground">{location}</span>
                    </div>
                 ) : (
                    <div className="flex items-center gap-2 p-2 mt-2 border rounded-md bg-muted">
                        <Loader2 className="h-5 w-5 text-primary animate-spin" />
                        <span className="text-sm text-muted-foreground">Obteniendo ubicación...</span>
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
