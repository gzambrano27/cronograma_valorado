
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import type { TaskValidation } from "@/lib/types";
import Image from "next/image";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { MapPin, Calendar } from "lucide-react";

interface ViewValidationsDialogProps {
  validations: TaskValidation[];
  taskName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewValidationsDialog({
  validations,
  taskName,
  open,
  onOpenChange,
}: ViewValidationsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle className="font-headline">Validaciones de Tarea: {taskName}</DialogTitle>
          <DialogDescription>
            Evidencia fotográfica y ubicación de las validaciones registradas para esta tarea.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {validations && validations.length > 0 ? (
            <Carousel className="w-full">
              <CarouselContent>
                {validations.map((validation) => (
                  <CarouselItem key={validation.id}>
                    <div className="p-1">
                      <Card>
                        <CardContent className="flex flex-col aspect-video items-center justify-center p-0 relative">
                           <Image
                            src={validation.imageUrl}
                            alt={`Validación para ${taskName}`}
                            fill
                            className="object-contain rounded-lg"
                           />
                           <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 rounded-b-lg">
                             <div className="flex items-center gap-2 text-white text-sm">
                               <Calendar className="h-4 w-4" />
                               <span>{format(new Date(validation.date), "PPP p", { locale: es })}</span>
                             </div>
                             <div className="flex items-center gap-2 text-white text-sm mt-1">
                                <MapPin className="h-4 w-4" />
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${validation.location}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-mono hover:underline"
                                >
                                  {validation.location}
                                </a>
                             </div>
                           </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          ) : (
            <div className="text-center text-muted-foreground py-10">
              No hay validaciones registradas para esta tarea.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
