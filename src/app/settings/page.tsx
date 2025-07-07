import { getAppConfig } from "@/lib/data";
import { updateSettings, syncProjectsFromEndpoint } from "@/lib/actions";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, DownloadCloud } from "lucide-react";

export default async function SettingsPage() {
    const config = await getAppConfig();

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
                                    defaultValue={config.endpointUrl}
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
                     <form action={syncProjectsFromEndpoint}>
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
                            <Button type="submit" variant="secondary">
                                <DownloadCloud className="mr-2 h-4 w-4" />
                                Sincronizar Proyectos
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}
