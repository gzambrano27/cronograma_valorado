
'use client'
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This is now a simple redirector page.
// It redirects everyone to the login page by default.
// The dashboard layout will handle auth checks for protected routes.
export default function Home() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/login');
    }, [router]);

    return (
      <div className="flex h-screen items-center justify-center">
        <p>Redirigiendo...</p>
      </div>
    );
}
