
'use client';

import { useActionState, useEffect } from 'react';
import { login } from '@/lib/auth-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { SubmitButton } from '@/components/layout/submit-button';
import { useRouter } from 'next/navigation';

/**
 * Página de inicio de sesión.
 * Permite a los usuarios autenticarse para acceder a la aplicación.
 */
export default function LoginPage() {
  const router = useRouter();
  // `useActionState` gestiona el estado del formulario y la acción del servidor `login`.
  const [state, formAction, isPending] = useActionState(login, undefined);

  useEffect(() => {
    // Este efecto se ejecuta cuando el estado de la acción del formulario cambia.
    // Si el inicio de sesión es exitoso, guarda la sesión y redirige al dashboard.
    if (state?.success && state.user) {
      const newSession = { isLoggedIn: true, user: state.user };
      try {
          // Guarda la sesión en el almacenamiento local del navegador.
          localStorage.setItem('userSession', JSON.stringify(newSession));
          // Redirige al dashboard, reemplazando la página de login en el historial.
          router.replace('/dashboard');
      } catch (error) {
          console.error("Error al guardar la sesión en localStorage", error);
      }
    }
  }, [state, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-0 shadow-none sm:border sm:shadow-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {/* Icono de la aplicación */}
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 7h3v3H7z"/><path d="M14 7h3v3h-3z"/><path d="M7 14h3v3H7z"/><path d="M14 14h3v3h-3z"/>
            </svg>
          </div>
          <CardTitle className="font-headline text-3xl">Centro de Aplicaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Usuario</Label>
              <Input
                id="email"
                name="email"
                type="text"
                placeholder="Ingresa tu usuario"
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" name="password" type="password" placeholder="••••••••" required className="h-11" />
            </div>
            {/* Muestra un mensaje de error si el inicio de sesión falla */}
            {state?.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}
            <SubmitButton className="w-full h-11 text-base" isPending={isPending}>Iniciar Sesión</SubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
