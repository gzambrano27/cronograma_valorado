
'use client';

import type { SessionData } from '@/lib/types';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';


type SessionContextType = {
    session: SessionData;
    setSession: (session: SessionData) => void;
    isLoading: boolean;
};

const defaultSession: SessionData = { isLoggedIn: false };

const SessionContext = createContext<SessionContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_SESSION = 'userSession';

export const SessionProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSessionState] = useState<SessionData>(defaultSession);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        try {
            const storedSession = localStorage.getItem(LOCAL_STORAGE_KEY_SESSION);
            if (storedSession) {
                const parsedSession: SessionData = JSON.parse(storedSession);
                setSessionState(parsedSession);
                
                // If user is logged in but on the login page, redirect them
                if (parsedSession.isLoggedIn && pathname === '/login') {
                    router.replace('/dashboard');
                }
            } else {
                // If no session and user is trying to access a protected route
                if (pathname.startsWith('/dashboard')) {
                    router.replace('/login');
                }
            }
        } catch (error) {
            console.error("Failed to parse session from localStorage", error);
            // On error, assume logged out and redirect if necessary
            localStorage.removeItem(LOCAL_STORAGE_KEY_SESSION);
            if (pathname.startsWith('/dashboard')) {
                router.replace('/login');
            }
        } finally {
            setIsLoading(false);
        }
    }, [pathname, router]);

    const setSession = useCallback((newSession: SessionData) => {
        setSessionState(newSession);
        try {
            if (newSession.isLoggedIn) {
                const sessionString = JSON.stringify(newSession);
                localStorage.setItem(LOCAL_STORAGE_KEY_SESSION, sessionString);
                // Also set a simple cookie for server-side checks if needed in the future,
                // but primary auth is client-side.
                document.cookie = `userSession=${sessionString}; path=/; max-age=604800; SameSite=Lax`; // 7 days
            } else {
                localStorage.removeItem(LOCAL_STORAGE_KEY_SESSION);
                // Expire the cookie
                document.cookie = 'userSession=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
            }
        } catch (error) {
            console.error("Failed to save session to localStorage", error);
        }
    }, []);
    
    return <SessionContext.Provider value={{ session, setSession, isLoading }}>{children}</SessionContext.Provider>
}

export const useSession = () => {
    const context = useContext(SessionContext);
    if(context === undefined) {
        throw new Error('useSession must be used within a SessionProvider');
    }
    return context;
}
