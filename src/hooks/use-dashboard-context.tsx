
'use client';

import type { Project, Company } from '@/lib/types';
import { createContext, useContext, ReactNode } from 'react';

type DashboardContextType = {
    allProjects: Project[];
};

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider = ({ children, allProjects }: { children: ReactNode, allProjects: Project[] }) => {
    return <DashboardContext.Provider value={{ allProjects }}>{children}</DashboardContext.Provider>
}

export const useDashboard = () => {
    const context = useContext(DashboardContext);
    if(context === undefined) {
        throw new Error('useDashboard must be used within a DashboardProvider');
    }
    return context;
}
