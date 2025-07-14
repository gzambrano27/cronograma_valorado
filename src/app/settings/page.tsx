
'use client';

import { useState, useEffect, useTransition } from "react";
import { getSettings, updateSettings, syncProjectsFromEndpoint } from "@/lib/actions";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, DownloadCloud, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, startSyncTransition] = useTransition();
    const { toast } = useToast();
    const router = useRouter();


    useEffect(() => {
        getSettings().then(config => {
            setUrl(config.endpointUrl || '');
            setIsLoading(false);
        }).catch(error => {
            console.error("Failed to load settings:", error);
            setIsLoading(false);
        });
    }, []);

    const handleSyncSubmit = () => {
        startSyncTransition(async () => {
            try {
                await syncProjectsFromEndpoint();
                toast({
                    title: "Sincronización Exitosa",
                    description: "Los proyectos se han actualizado correctamente.",
                });
                router.push('/dashboard');
            } catch (error) {
                toast({
                    variant: "destructive",
                    title: "Error de Sincronización",
                    description: error instanceof Error ? error.message : "Ocurrió un error inesperado.",
                });
            }
        });
    };

    if (isLoading) {
        return (
            <div className="flex-1 space-y-6 p-4 sm:p-6 md:p-8">
                <div className="flex items-center justify-between space-y-2">
                    <Skeleton className="h-9 w-48" />
                </div>
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
                        <CardFooter className="border-t px-6 py-4">
                            <Skeleton className="h-10 w-32" />
                        </CardFooter>
                    </Card>
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-1/2" />
                            <Skeleton className="h-4 w-3/4" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-20 w-full" />
                        </CardContent>
                        <CardFooter className="border-t px-6 py-4">
                            <Skeleton className="h-10 w-48" />
                        </CardFooter>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-6 p-4 sm:p-6 md:p-8">
            <div className="flex items-center justify-between space-y-2">
                <h1 className="text-3xl font-bold tracking-tight font-headline">
                    Configuración
                </h1>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <form action={updateSettings}>
                        <CardHeader>
                            <CardTitle>Endpoint de Proyectos</CardTitle>
                            <CardDescription>
                                Introduce la URL del endpoint JSON para sincronizar los proyectos.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Label htmlFor="url">URL del Endpoint</Label>
                                <Input 
                                    id="url" 
                                    name="url" 
                                    type="url"
                                    placeholder="https://tu-api.com/projects"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    required
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="border-t px-6 py-4">
                            <Button type="submit">Guardar Cambios</Button>
                        </CardFooter>
                    </form>
                </Card>

                <Card>
                     <form action={handleSyncSubmit}>
                        <CardHeader>
                            <CardTitle>Sincronización</CardTitle>
                            <CardDescription>
                                Obtén los proyectos desde el endpoint configurado.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Alert variant="destructive">
                                <Terminal className="h-4 w-4" />
                                <AlertTitle>¡Acción Irreversible!</AlertTitle>
                                <AlertDescription>
                                    La sincronización eliminará todos los proyectos y tareas actuales y los reemplazará con los datos del endpoint.
                                </AlertDescription>
                            </Alert>
                        </CardContent>
                        <CardFooter className="border-t px-6 py-4">
                            <Button type="submit" variant="secondary" disabled={isSyncing}>
                                {isSyncing ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <DownloadCloud className="mr-2 h-4 w-4" />
                                )}
                                {isSyncing ? "Sincronizando..." : "Sincronizar Proyectos"}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}
