
'use client';

import { useState, useEffect } from "react";
import { updateSettings, fetchEndpointData } from "@/lib/actions";
import { getAppConfig } from "@/lib/data";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, DownloadCloud, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { ConfirmSyncDialog } from "@/components/settings/confirm-sync-dialog";

export default function SettingsPage() {
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isFetching, setIsFetching] = useState(false);
    const [syncData, setSyncData] = useState<any>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const { toast } = useToast();
    const router = useRouter();


    useEffect(() => {
        getAppConfig().then(config => {
            setUrl(config.endpointUrl || '');
            setIsLoading(false);
        }).catch(error => {
            console.error("Failed to load settings:", error);
            setIsLoading(false);
        });
    }, []);

    const handleFetchData = async () => {
        setIsFetching(true);
        try {
            const data = await fetchEndpointData();
            setSyncData(data);
            setIsConfirmOpen(true);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error al Obtener Datos",
                description: error instanceof Error ? error.message : "Ocurrió un error inesperado al obtener los datos.",
            });
        } finally {
            setIsFetching(false);
        }
    };
    
    const onSyncSuccess = () => {
        toast({
            title: "Sincronización Exitosa",
            description: "Los proyectos se han actualizado correctamente.",
        });
        router.push('/dashboard');
    }

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
             {syncData && (
                <ConfirmSyncDialog
                    data={syncData}
                    open={isConfirmOpen}
                    onOpenChange={setIsConfirmOpen}
                    onSuccess={onSyncSuccess}
                />
            )}
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
                     <form action={handleFetchData}>
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
                            <Button type="submit" variant="secondary" disabled={isFetching}>
                                {isFetching ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <DownloadCloud className="mr-2 h-4 w-4" />
                                )}
                                {isFetching ? "Obteniendo datos..." : "Sincronizar Proyectos"}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}
