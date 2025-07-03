"use client"

import { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useToast } from '@/hooks/use-toast';

export function XmlImport() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Here you would implement the file parsing and data extraction logic.
            // For this demo, we'll just show a toast.
            console.log("Selected file:", file.name);
            toast({
                title: "Archivo Cargado",
                description: `El archivo ${file.name} está listo para ser procesado.`,
            });
        }
    };

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <>
            <input
                type="file"
                accept=".xml"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
            />
            <Button variant="outline" onClick={handleButtonClick}>
                <Upload className="mr-2 h-4 w-4" />
                Importar XML de MS Project
            </Button>
        </>
    );
}
