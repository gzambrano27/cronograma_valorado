
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

export default function LoginPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(login, undefined);

  useEffect(() => {
    // When the login server action is successful, the state will be updated.
    // We then save the session to localStorage and redirect to the dashboard.
    if (state?.success && state.user) {
      const newSession = { isLoggedIn: true, user: state.user };
      try {
          localStorage.setItem('userSession', JSON.stringify(newSession));
      } catch (error) {
          console.error("Failed to save session to localStorage", error);
          // Handle potential storage errors, e.g., private browsing mode
      }
      router.replace('/dashboard');
    }
  }, [state, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-0 shadow-none sm:border sm:shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
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
