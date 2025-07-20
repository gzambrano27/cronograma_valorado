
'use client'
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/use-session';

export default function Home() {
    const router = useRouter();
    const { session } = useSession();

    useEffect(() => {
        // This component only runs on the client, so it's safe to use router here.
        // The middleware has already handled initial redirection if necessary.
        if (session.isLoggedIn) {
            router.replace('/dashboard');
        } else {
            router.replace('/login');
        }
    }, [router, session.isLoggedIn]);

    // Display a loading state while redirecting
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Redirigiendo...</p>
      </div>
    );
}
