
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";


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
                    <CardTitle>Base de Datos</CardTitle>
                    <CardDescription>
                        La aplicación está ahora conectada a una base de datos PostgreSQL.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert>
                        <Terminal className="h-4 w-4" />
                        <AlertTitle>Información</AlertTitle>
                        <AlertDescription>
                            La gestión de proyectos (crear, editar, eliminar) se realiza directamente en la base de datos de origen (Odoo). Esta aplicación sirve como una herramienta de solo lectura para proyectos y para la gestión detallada de sus cronogramas y tareas.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-1/2" />
                        <Skeleton className="h-4 w-3/4" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-1/2" />
                        <Skeleton className="h-4 w-3/4" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-20 w-full" />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
