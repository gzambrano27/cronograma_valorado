"use client"

import { useRef, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { importTasksFromXML } from '@/lib/actions';
import { useParams } from 'next/navigation';

export function XmlImport() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const params = useParams();
    const projectId = params.id as string;

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && formRef.current) {
           startTransition(async () => {
                const formData = new FormData(formRef.current!);
                try {
                    await importTasksFromXML(projectId, formData);
                    toast({
                        title: "Importación Exitosa",
                        description: "Las tareas del archivo XML han sido importadas.",
                    });
                } catch (error: any) {
                    toast({
                        variant: "destructive",
                        title: "Error de Importación",
                        description: error.message || "No se pudieron importar las tareas.",
                    });
                } finally {
                    // Reset file input
                    if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                    }
                }
           });
        }
    };

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <form ref={formRef}>
            <input
                type="file"
                name="xmlFile"
                accept=".xml,application/xml,text/xml"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                disabled={isPending}
            />
            <Button variant="outline" type="button" onClick={handleButtonClick} disabled={isPending}>
                {isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Upload className="mr-2 h-4 w-4" />
                )}
                {isPending ? "Importando..." : "Importar XML de MS Project"}
            </Button>
        </form>
    );
}
