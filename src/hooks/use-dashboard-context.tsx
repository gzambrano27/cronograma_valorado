
'use client';

import type { Project, Company } from '@/lib/types';
import { createContext, useContext } from 'react';

type DashboardContextType = {
    allProjects: Project[];
    selectedCompanies: Company[];
};

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider = ({ children, value }: { children: React.ReactNode, value: DashboardContextType }) => {
    return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
}

export const useDashboard = () => {
    const context = useContext(DashboardContext);
    if(context === undefined) {
        throw new Error('useDashboard must be used within a DashboardProvider');
    }
    return context;
}
