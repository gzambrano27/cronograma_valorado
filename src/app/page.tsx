
'use client'
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
    const router = useRouter();

    useEffect(() => {
      // Logic moved to login page to handle session check
      router.replace('/login');
    }, [router]);

    // Display a loading state while redirecting
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Redirigiendo...</p>
      </div>
    );
}
