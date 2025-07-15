
"use client";

import { useState, useTransition } from "react";
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
import { Button } from "../ui/button";
import { syncProjectsFromEndpoint } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "../ui/scroll-area";
import { Loader2 } from "lucide-react";

interface ConfirmSyncDialogProps {
  data: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ConfirmSyncDialog({
  data,
  open,
  onOpenChange,
  onSuccess,
}: ConfirmSyncDialogProps) {
  const [isSyncing, startSyncTransition] = useTransition();
  const { toast } = useToast();

  const handleConfirm = async () => {
    startSyncTransition(async () => {
      try {
        await syncProjectsFromEndpoint(data);
        onSuccess();
        onOpenChange(false);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error de Sincronización",
          description:
            error instanceof Error
              ? error.message
              : "Ocurrió un error inesperado al sincronizar.",
        });
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Sincronización</AlertDialogTitle>
          <AlertDialogDescription>
            Se han obtenido los siguientes datos del endpoint. Por favor, revisa
            que el formato sea correcto antes de confirmar la sincronización.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="my-4">
          <ScrollArea className="h-72 w-full rounded-md border p-4">
            <pre className="text-xs">
              <code>{JSON.stringify(data, null, 2)}</code>
            </pre>
          </ScrollArea>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSyncing}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isSyncing}>
            {isSyncing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sincronizando...
              </>
            ) : (
              "Sí, sincronizar ahora"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
