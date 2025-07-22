
import { getProjects } from "@/lib/data";
import { ConnectionError } from '@/components/layout/connection-error';
import { DashboardProvider } from '@/hooks/use-dashboard-context';
import AuthLayoutClient from "@/components/layout/auth-layout-client";
import { checkDbConnection } from "@/lib/db";
import { SessionProvider } from "@/hooks/use-session";
import { ThemeProvider } from "@/components/layout/theme-provider";

// Forza el renderizado dinámico para todas las rutas dentro de este layout.
// Esto asegura que los datos se obtienen de la base de datos en cada solicitud,
// manteniendo la información (como el progreso del proyecto) siempre actualizada.
export const dynamic = 'force-dynamic';

// Este es el layout principal para el área de dashboard después de la autenticación.
// Es un Server Component por defecto, lo que permite realizar la carga de datos inicial en el servidor.

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 1. Verificar la conexión a la base de datos en el servidor.
  const isDbConnected = await checkDbConnection();
  if (!isDbConnected) {
    return <ConnectionError />;
  }
  
  // 2. Obtener los datos iniciales (proyectos) en el servidor.
  // Esto se ejecuta en cada navegación/recarga dentro del dashboard, asegurando datos frescos.
  const projects = await getProjects();

  return (
    // 3. Envolver las rutas del dashboard con los proveedores de contexto necesarios.
    // SessionProvider y ThemeProvider se colocan aquí para que estén disponibles en todas las rutas protegidas.
    <SessionProvider>
        <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
        >
            <DashboardProvider allProjects={projects}>
              {/* AuthLayoutClient es un componente de cliente que gestiona la sesión y protege las rutas */}
              <AuthLayoutClient>
                  {children}
              </Auth-layout-client>
            </DashboardProvider>
        </ThemeProvider>
    </SessionProvider>
  );
}
