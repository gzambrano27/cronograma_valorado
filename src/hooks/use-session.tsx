
'use client';

import type { SessionData } from '@/lib/session';
import { createContext, useContext } from 'react';

type SessionContextType = {
    session: SessionData | null;
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider = ({ children, value }: { children: React.ReactNode, value: SessionContextType }) => {
    return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export const useSession = () => {
    const context = useContext(SessionContext);
    if(context === undefined) {
        throw new Error('useSession must be used within a SessionProvider');
    }
    return context;
}
