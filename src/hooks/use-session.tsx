
'use client';

import type { SessionData } from '@/lib/types';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

type SessionContextType = {
    session: SessionData;
    setSession: (session: SessionData) => void;
    isLoading: boolean;
};

// Sesión por defecto, indica que el usuario no está autenticado.
const defaultSession: SessionData = { isLoggedIn: false };

const SessionContext = createContext<SessionContextType | undefined>(undefined);

// Clave para guardar la sesión en el almacenamiento local del navegador.
const LOCAL_STORAGE_KEY_SESSION = 'userSession';

/**
 * Proveedor de contexto para la sesión del usuario.
 * Gestiona el estado de la sesión, lo persiste en localStorage y lo
 * hace disponible para el resto de la aplicación a través del hook `useSession`.
 */
export const SessionProvider = ({ children }: { children: ReactNode }) => {
    const [session, setSessionState] = useState<SessionData>(defaultSession);
    const [isLoading, setIsLoading] = useState(true); // Comienza en estado de carga.

    useEffect(() => {
        // Este efecto se ejecuta solo en el cliente, después del montaje inicial.
        try {
            const storedSession = localStorage.getItem(LOCAL_STORAGE_KEY_SESSION);
            if (storedSession) {
                const parsedSession: SessionData = JSON.parse(storedSession);
                setSessionState(parsedSession);
            }
        } catch (error) {
            console.error("Error al leer la sesión de localStorage", error);
            localStorage.removeItem(LOCAL_STORAGE_KEY_SESSION);
            setSessionState(defaultSession);
        } finally {
            setIsLoading(false); // Termina la carga, independientemente del resultado.
        }
    }, []);

    // Función para actualizar la sesión y guardarla en localStorage.
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
            console.error("Error al guardar la sesión en localStorage", error);
        }
    }, []);

    const value = { session, setSession, isLoading };
    
    return (
        <SessionContext.Provider value={value}>
            {children}
        </SessionContext.Provider>
    );
}

/**
 * Hook personalizado para acceder al contexto de la sesión.
 * Lanza un error si se usa fuera de un `SessionProvider`.
 */
export const useSession = () => {
    const context = useContext(SessionContext);
    if(context === undefined) {
        throw new Error('useSession debe ser utilizado dentro de un SessionProvider');
    }
    return context;
}
