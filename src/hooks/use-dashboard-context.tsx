
'use client';

import type { Project, Company } from '@/lib/types';
import React, { createContext, useContext, ReactNode, useState, Dispatch, SetStateAction } from 'react';

type DashboardContextType = {
    allProjects: Project[];
    selectedCompanies: Company[];
    setSelectedCompanies: Dispatch<SetStateAction<Company[]>>;
};

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider = ({ children, allProjects }: { children: ReactNode, allProjects: Project[] }) => {
    const [selectedCompanies, setSelectedCompanies] = useState<Company[]>([]);
    
    const value = {
      allProjects,
      selectedCompanies,
      setSelectedCompanies
    };

    return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
}

export const useDashboard = () => {
    const context = useContext(DashboardContext);
    if(context === undefined) {
        throw new Error('useDashboard must be used within a DashboardProvider');
    }
    return context;
}
