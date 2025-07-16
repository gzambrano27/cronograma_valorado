
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";


export default function SettingsPage() {

    return (
        <div className="flex-1 space-y-6 p-4 sm:p-6 md:p-8">
            <div className="flex items-center justify-between space-y-2">
                <h1 className="text-3xl font-bold tracking-tight font-headline">
                    Configuración
                </h1>
            </div>

             <Card>
                <CardHeader>
                    <CardTitle>Conexión a la Base de Datos</CardTitle>
                    <CardDescription>
                        Información sobre el origen de los datos del proyecto.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert>
                        <Terminal className="h-4 w-4" />
                        <AlertTitle>Modo de Conexión Directa</AlertTitle>
                        <AlertDescription>
                            La aplicación está configurada para leer los proyectos directamente desde la base de datos de Odoo. La gestión de proyectos (crear, editar, eliminar) se realiza en Odoo. Esta aplicación se utiliza para la gestión detallada de los cronogramas y tareas de esos proyectos.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        </div>
    );
}
