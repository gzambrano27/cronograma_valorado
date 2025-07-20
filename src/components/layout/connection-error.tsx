
"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";

/**
 * Componente que se muestra cuando la aplicación no puede conectarse a la base de datos.
 * Proporciona un mensaje de error claro y una opción para reintentar la conexión.
 */
export function ConnectionError() {

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
      <Card className="w-full max-w-md text-center border-destructive/50 shadow-lg shadow-destructive/10">
        <CardHeader>
          <div className="mx-auto bg-destructive/10 p-4 rounded-full w-fit">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="font-headline text-2xl pt-4">Error de Conexión</CardTitle>
          <CardDescription className="text-base">
            No se pudo establecer una conexión con la base de datos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Por favor, asegúrese de que el servidor de la base de datos esté en ejecución y que las credenciales en el archivo de configuración sean correctas.
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={handleReload} className="w-full" variant="destructive">
            <RefreshCw className="mr-2 h-4 w-4" />
            Intentar de Nuevo
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
