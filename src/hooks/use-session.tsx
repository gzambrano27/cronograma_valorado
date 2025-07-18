
'use client';

import type { SessionData } from '@/lib/types';
import React, { createContext, useContext, useState } from 'react';

type SessionContextType = {
    session: SessionData;
    setSession: React.Dispatch<React.SetStateAction<SessionData>>;
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider = ({ children, initialSession }: { children: React.ReactNode, initialSession: SessionData }) => {
    const [session, setSession] = useState<SessionData>(initialSession);
    
    return <SessionContext.Provider value={{ session, setSession }}>{children}</SessionContext.Provider>
}

export const useSession = () => {
    const context = useContext(SessionContext);
    if(context === undefined) {
        throw new Error('useSession must be used within a SessionProvider');
    }
    return context;
}
