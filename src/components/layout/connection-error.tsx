
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

export function ConnectionError() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Alert variant="destructive" className="max-w-lg">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle className="font-headline text-xl">Error de Conexión</AlertTitle>
        <AlertDescription className="mt-2">
          <p>No se pudo establecer una conexión con la base de datos.</p>
          <p className="mt-2 text-sm text-muted-foreground">Por favor, asegúrese de que el servidor de la base de datos PostgreSQL esté en ejecución y que las credenciales en el archivo `.env` sean correctas. Una vez solucionado, recargue la página.</p>
        </AlertDescription>
      </Alert>
    </div>
  );
}
