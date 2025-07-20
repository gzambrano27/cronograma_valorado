
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
import type { Task, TaskValidation } from "@/lib/types";
import Image from "next/image";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { MapPin, Calendar, Trash2, User } from "lucide-react";
import { Button } from "../ui/button";
import { useState } from "react";
import { DeleteValidationDialog } from "./delete-validation-dialog";

interface ViewValidationsDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ViewValidationsDialog({
  task,
  open,
  onOpenChange,
  onSuccess
}: ViewValidationsDialogProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedValidation, setSelectedValidation] = useState<TaskValidation | null>(null);

  const handleDeleteClick = (validation: TaskValidation) => {
    setSelectedValidation(validation);
    setIsDeleteDialogOpen(true);
  };
  
  const handleSuccess = () => {
    onSuccess();
    // Potentially close this dialog if no validations are left
    if (task.validations && task.validations.length <= 1) {
        onOpenChange(false);
    }
  }

  return (
    <>
      {selectedValidation && (
         <DeleteValidationDialog
            validationId={selectedValidation.id}
            projectId={task.projectId}
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            onSuccess={handleSuccess}
        />
      )}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] max-w-6xl">
          <DialogHeader>
            <DialogTitle className="font-headline">Validaciones de Tarea: {task.name}</DialogTitle>
            <DialogDescription>
              Evidencia fotográfica y ubicación de las validaciones registradas para esta tarea.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {task.validations && task.validations.length > 0 ? (
              <Carousel className="w-full">
                <CarouselContent>
                  {task.validations.map((validation) => (
                    <CarouselItem key={validation.id}>
                      <div className="p-1">
                        <Card>
                          <CardContent className="flex flex-col aspect-video items-center justify-center p-0 relative group">
                            <Image
                              src={validation.imageUrl}
                              alt={`Validación para ${task.name}`}
                              fill
                              className="object-contain rounded-lg"
                            />
                            <div className="absolute top-2 right-2 z-10">
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleDeleteClick(validation)}
                                >
                                    <Trash2 className="h-4 w-4"/>
                                    <span className="sr-only">Eliminar Validación</span>
                                </Button>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 rounded-b-lg text-white">
                              <div className="flex items-center gap-2 text-sm">
                                <User className="h-4 w-4" />
                                <span>Subido por: <strong>{validation.username || 'Desconocido'}</strong></span>
                              </div>
                              <div className="flex items-center gap-2 text-sm mt-1">
                                <Calendar className="h-4 w-4" />
                                <span>{format(new Date(validation.date), "PPP p", { locale: es })}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm mt-1">
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
    </>
  );
}
