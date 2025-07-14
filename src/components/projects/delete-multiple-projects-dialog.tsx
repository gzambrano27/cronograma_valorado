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
import { deleteMultipleProjects } from "@/lib/actions";
import { useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Project } from "@/lib/types";
import { Button } from "../ui/button";

interface DeleteMultipleProjectsDialogProps {
  projects: Project[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DeleteMultipleProjectsDialog({
  projects,
  open,
  onOpenChange,
  onSuccess,
}: DeleteMultipleProjectsDialogProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const projectIds = projects.map(p => p.id);

  const handleDelete = async () => {
    startTransition(async () => {
      try {
        await deleteMultipleProjects(projectIds);
        toast({
          title: "Proyectos Eliminados",
          description: "Los proyectos seleccionados han sido eliminados.",
        });
        onOpenChange(false);
        onSuccess(); // Call onSuccess to trigger data reload
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron eliminar los proyectos.",
        });
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Esto eliminará permanentemente 
            {` ${projects.length} `} 
            proyecto(s) y todas sus tareas asociadas.
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
              {isPending ? "Eliminando..." : `Sí, eliminar ${projects.length} proyecto(s)`}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
