
'use client';

import type { SessionData } from '@/lib/types';
import { createContext, useContext } from 'react';

type SessionContextType = {
    session: SessionData;
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider = ({ children, value }: { children: React.ReactNode, value: SessionData }) => {
    return <SessionContext.Provider value={{ session: value }}>{children}</SessionContext.Provider>
}

export const useSession = () => {
    const context = useContext(SessionContext);
    if(context === undefined) {
        throw new Error('useSession must be used within a SessionProvider');
    }
    return context;
}
