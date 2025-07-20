
'use client';

import type { SessionData } from '@/lib/types';
import React, { createContext, useContext, useState, useEffect } from 'react';

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

    useEffect(() => {
        try {
            const storedSession = localStorage.getItem(LOCAL_STORAGE_KEY_SESSION);
            if (storedSession) {
                setSessionState(JSON.parse(storedSession));
            }
        } catch (error) {
            console.error("Failed to parse session from localStorage", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const setSession = (newSession: SessionData) => {
        setSessionState(newSession);
        try {
            if (newSession.isLoggedIn) {
                localStorage.setItem(LOCAL_STORAGE_KEY_SESSION, JSON.stringify(newSession));
            } else {
                localStorage.removeItem(LOCAL_STORAGE_KEY_SESSION);
            }
        } catch (error) {
            console.error("Failed to save session to localStorage", error);
        }
    };
    
    return <SessionContext.Provider value={{ session, setSession, isLoading }}>{children}</SessionContext.Provider>
}

export const useSession = () => {
    const context = useContext(SessionContext);
    if(context === undefined) {
        throw new Error('useSession must be used within a SessionProvider');
    }
    return context;
}
