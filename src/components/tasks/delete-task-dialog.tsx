
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
import { deleteTask } from "@/lib/actions";
import { useTransition } from "react";
import { useToast } from "@/hooks/use-toast";

interface DeleteTaskDialogProps {
  taskId: number;
  projectId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

/**
 * Diálogo de confirmación para eliminar una única tarea.
 */
export function DeleteTaskDialog({
  taskId,
  projectId,
  open,
  onOpenChange,
  onSuccess,
}: DeleteTaskDialogProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleDelete = async () => {
    startTransition(async () => {
      try {
        const result = await deleteTask(taskId, projectId);
        if (result?.success) {
          toast({
            title: "Tarea Eliminada",
            description: "La tarea ha sido eliminada exitosamente del proyecto.",
          });
          onSuccess();
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo eliminar la tarea.",
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
          <AlertDialogTitle>¿Está realmente seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Esto eliminará permanentemente la
            tarea de la base de datos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isPending ? "Eliminando..." : "Sí, eliminar tarea"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
