
"use client"

import { useRef, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { importTasksFromXML } from '@/lib/actions';
import { useRouter } from 'next/navigation';

export function XmlImport({ projectId, onSuccess }: { projectId: number, onSuccess: () => void }) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const { toast } = useToast();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && formRef.current) {
           startTransition(async () => {
                const formData = new FormData(formRef.current!);
                try {
                    const result = await importTasksFromXML(projectId, formData);
                    if (result?.success) {
                        toast({
                            title: "Importación Exitosa",
                            description: "Las tareas del archivo XML han sido importadas.",
                        });
                        onSuccess();
                    }
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
            <Button variant="outline" type="button" onClick={handleButtonClick} disabled={isPending || !projectId}>
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
