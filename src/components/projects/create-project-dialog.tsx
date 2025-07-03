"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createProject, updateProject } from "@/lib/actions";
import type { Project } from "@/lib/types";
import { PlusCircle } from "lucide-react";
import React from "react";
import { useFormStatus } from "react-dom";

function SubmitButton({ isEditing }: { isEditing: boolean }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? (isEditing ? "Guardando..." : "Creando...") : (isEditing ? "Guardar Cambios" : "Crear Proyecto")}
        </Button>
    );
}

export function CreateProjectDialog({
  project,
  open,
  onOpenChange,
  children
}: {
  project?: Project;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}) {
  const isEditing = !!project;
  const formAction = isEditing ? updateProject : createProject;
  const formRef = React.useRef<HTMLFormElement>(null);

  const [internalOpen, setInternalOpen] = React.useState(false);
  const isOpen = open ?? internalOpen;
  const setIsOpen = onOpenChange ?? setInternalOpen;
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children || (
        <DialogTrigger asChild>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Crear Proyecto
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px]">
        <form 
          ref={formRef} 
          action={async (formData) => {
            await formAction(formData);
            setIsOpen(false);
          }}
          key={project?.id || 'new'}
        >
          <DialogHeader>
            <DialogTitle className="font-headline">
              {isEditing ? "Editar Proyecto" : "Crear Nuevo Proyecto"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Edita los detalles de tu proyecto."
                : "Añade los detalles de tu nuevo proyecto. Haz clic en guardar cuando hayas terminado."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {isEditing && <input type="hidden" name="id" value={project.id} />}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nombre
              </Label>
              <Input
                id="name"
                name="name"
                defaultValue={project?.name || ""}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Descripción
              </Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe tu proyecto aquí."
                defaultValue={project?.description || ""}
                className="col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter>
             <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
             <SubmitButton isEditing={isEditing} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
