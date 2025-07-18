
'use client'
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/use-session';

export default function Home() {
    const router = useRouter();
    const { session } = useSession();

    useEffect(() => {
        if (session.isLoggedIn) {
            router.replace('/dashboard');
        } else {
            router.replace('/login');
        }
    }, [router, session.isLoggedIn]);

    return (
      <div className="flex h-screen items-center justify-center">
        <p>Redirigiendo...</p>
      </div>
    );
}
