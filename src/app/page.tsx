
'use client'
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/use-session';

export default function Home() {
    const router = useRouter();
    const { session, isLoading } = useSession();

    useEffect(() => {
      if (!isLoading) {
        if (session.isLoggedIn) {
          router.replace('/dashboard');
        } else {
          router.replace('/login');
        }
      }
    }, [isLoading, session.isLoggedIn, router]);

    return (
      <div className="flex h-screen items-center justify-center">
        <p>Redirigiendo...</p>
      </div>
    );
}
