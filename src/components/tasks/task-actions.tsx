
"use client";

import { useState } from "react";
import type { Task } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash2, Camera, GalleryThumbnails } from "lucide-react";
import { DeleteTaskDialog } from "./delete-task-dialog";
import { ValidateTaskDialog } from "./validate-task-dialog";
import { ViewValidationsDialog } from "./view-validations-dialog";

interface TaskActionsProps {
  task: Task;
  onSuccess: () => void;
}

export function TaskActions({ task, onSuccess }: TaskActionsProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isValidateDialogOpen, setIsValidateDialogOpen] = useState(false);
  const [isViewValidationsOpen, setIsViewValidationsOpen] = useState(false);

  const hasValidations = task.validations && task.validations.length > 0;

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <DeleteTaskDialog
        taskId={task.id}
        projectId={task.projectId}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onSuccess={onSuccess}
      />
      <ValidateTaskDialog
        task={task}
        open={isValidateDialogOpen}
        onOpenChange={setIsValidateDialogOpen}
      />
      {hasValidations && (
        <ViewValidationsDialog
          validations={task.validations!}
          taskName={task.name}
          open={isViewValidationsOpen}
          onOpenChange={setIsViewValidationsOpen}
        />
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Más opciones</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setIsValidateDialogOpen(true)}>
            <Camera className="mr-2 h-4 w-4" />
            {hasValidations ? "Añadir Validación" : "Validar Tarea"}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setIsViewValidationsOpen(true)} disabled={!hasValidations}>
            <GalleryThumbnails className="mr-2 h-4 w-4" />
            Ver Validaciones
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => setIsDeleteDialogOpen(true)}
            className="text-destructive focus:text-destructive focus:bg-destructive/10"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
