
'use client';
import AppShell from '@/components/layout/app-shell';
import { useDashboard } from '@/hooks/use-dashboard-context';
import type { Company } from '@/lib/types';
import React, { useEffect, useState } from 'react';
import { useSession } from '@/hooks/use-session';
import { usePathname, useRouter } from 'next/navigation';

const LOCAL_STORAGE_KEY_COMPANIES = 'selectedCompanies';

/**
 * Componente "guardián" del lado del cliente.
 * Se encarga de proteger las rutas del dashboard, gestionando la sesión del usuario
 * y los datos de contexto como las compañías seleccionadas.
 */
export default function AuthLayoutClient({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { session, setSession, isLoading } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const user = session.user;
  const { allProjects, selectedCompanies, setSelectedCompanies } = useDashboard();
  
  // Estado para controlar la carga inicial de las compañías desde localStorage.
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    // Mientras la sesión carga, no hacer nada.
    if (isLoading) {
      return; 
    }
    // Si la carga ha terminado y el usuario no está logueado, redirigir al login.
    if (!session.isLoggedIn && pathname !== '/login') {
      router.replace('/login');
      return;
    }
    
    // La revalidación de permisos ahora se basa en el inicio de sesión.
    // Si un administrador cambia los permisos, el usuario debe volver a iniciar sesión
    // para que se reflejen, lo cual es un patrón de seguridad estándar.

  }, [session.isLoggedIn, isLoading, router, pathname]);
  
  useEffect(() => {
    // Al cargar el componente y si el usuario existe, intenta cargar las compañías
    // seleccionadas desde localStorage para mantener la persistencia.
    if (user?.allowedCompanies && user.company && isInitialLoad) {
      try {
        const storedCompanies = localStorage.getItem(LOCAL_STORAGE_KEY_COMPANIES);
        if (storedCompanies) {
          const parsedCompanies = JSON.parse(storedCompanies);
          // Valida que las compañías guardadas sigan siendo permitidas para el usuario.
          const validStoredCompanies = parsedCompanies.filter((sc: Company) => 
            user.allowedCompanies.some(ac => ac.id === sc.id)
          );
          if (validStoredCompanies.length > 0) {
            setSelectedCompanies(validStoredCompanies);
          } else {
             setSelectedCompanies([user.company]); // Fallback a la compañía por defecto.
          }
        } else {
          setSelectedCompanies([user.company]); // Si no hay nada guardado, usa la de por defecto.
        }
      } catch (error) {
        console.error("Error al procesar las compañías desde localStorage", error);
        setSelectedCompanies([user.company]);
      }
      setIsInitialLoad(false);
    } else if (user?.company && isInitialLoad) {
        setSelectedCompanies([user.company]);
        setIsInitialLoad(false);
    }
  }, [user, isInitialLoad, setSelectedCompanies]);

  useEffect(() => {
    // Guarda las compañías seleccionadas en localStorage cada vez que cambian.
    if (!isInitialLoad && selectedCompanies.length > 0) {
      try {
          localStorage.setItem(LOCAL_STORAGE_KEY_COMPANIES, JSON.stringify(selectedCompanies));
      } catch (error) {
          console.error("Error al guardar las compañías en localStorage", error);
      }
    }
  }, [selectedCompanies, isInitialLoad]);

  // Muestra un estado de carga mientras se verifica la sesión.
  if (isLoading || !session.isLoggedIn) {
     return (
        <div className="flex h-screen items-center justify-center">
            <p>Verificando sesión...</p>
        </div>
    );
  }

  // Una vez verificado, renderiza el layout principal de la aplicación (AppShell).
  return (
    <AppShell 
        allProjects={allProjects}
        selectedCompanies={selectedCompanies}
        onCompanyChange={setSelectedCompanies}
    >
        {children}
    </AppShell>
  );
}
