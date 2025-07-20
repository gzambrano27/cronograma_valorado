
'use client'
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/use-session';

/**
 * Página de inicio de la aplicación.
 * Actúa como un punto de entrada que redirige al usuario a la página de login
 * o al dashboard si ya tiene una sesión activa.
 */
export default function Home() {
    const router = useRouter();

    useEffect(() => {
        // Redirige siempre a la página de login.
        // La lógica de sesión en el layout del dashboard se encargará de
        // redirigir a los usuarios ya autenticados.
        router.replace('/login');
    }, [router]);

    return (
      <div className="flex h-screen items-center justify-center">
        <p>Redirigiendo...</p>
      </div>
    );
}
