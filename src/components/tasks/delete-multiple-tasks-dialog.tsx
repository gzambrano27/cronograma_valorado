
"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteMultipleTasks } from "@/lib/actions";
import { useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Task } from "@/lib/types";
import { Button } from "../ui/button";

interface DeleteMultipleTasksDialogProps {
  tasks: Task[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

/**
 * Diálogo de confirmación para eliminar múltiples tareas seleccionadas.
 */
export function DeleteMultipleTasksDialog({
  tasks,
  open,
  onOpenChange,
  onSuccess,
}: DeleteMultipleTasksDialogProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const taskIds = tasks.map(t => t.id);
  const projectId = tasks[0]?.projectId;

  const handleDelete = async () => {
    if (!projectId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo determinar el proyecto de las tareas.",
      });
      return;
    }

    startTransition(async () => {
      try {
        const result = await deleteMultipleTasks(taskIds, projectId);
        if (result?.success) {
          toast({
            title: "Tareas Eliminadas",
            description: "Las tareas seleccionadas han sido eliminadas correctamente.",
          });
          onSuccess();
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Ocurrió un error al eliminar las tareas.",
        });
      } finally {
        onOpenChange(false);
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Está seguro de que desea continuar?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Se eliminarán permanentemente 
            {` ${tasks.length} `} 
            tarea(s) del proyecto.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            asChild
          >
            <Button className="bg-destructive hover:bg-destructive/90">
              {isPending ? "Eliminando..." : `Sí, eliminar ${tasks.length} tarea(s)`}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
