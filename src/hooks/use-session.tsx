
'use client';

import type { SessionData } from '@/lib/types';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

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
                const parsedSession: SessionData = JSON.parse(storedSession);
                setSessionState(parsedSession);
            }
        } catch (error) {
            console.error("Failed to parse session from localStorage", error);
            localStorage.removeItem(LOCAL_STORAGE_KEY_SESSION);
            setSessionState(defaultSession);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const setSession = useCallback((newSession: SessionData) => {
        setSessionState(newSession);
        try {
            if (newSession.isLoggedIn) {
                const sessionString = JSON.stringify(newSession);
                localStorage.setItem(LOCAL_STORAGE_KEY_SESSION, sessionString);
            } else {
                localStorage.removeItem(LOCAL_STORAGE_KEY_SESSION);
            }
        } catch (error) {
            console.error("Failed to save session to localStorage", error);
        }
    }, []);

    const value = { session, setSession, isLoading };

    return (
        <SessionContext.Provider value={value}>
            {children}
        </SessionContext.Provider>
    );
}

export const useSession = () => {
    const context = useContext(SessionContext);
    if(context === undefined) {
        throw new Error('useSession must be used within a SessionProvider');
    }
    return context;
}
