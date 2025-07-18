
'use client';
import AppShell from '@/components/layout/app-shell';
import { DashboardProvider } from '@/hooks/use-dashboard-context';
import type { Company, Project, SessionData } from '@/lib/types';
import React from 'react';

const LOCAL_STORAGE_KEY = 'selectedCompanies';

export default function AuthLayoutClient({
  children,
  session,
  allProjects
}: Readonly<{
  children: React.ReactNode;
  session: SessionData;
  allProjects: Project[];
}>) {
  const user = session?.user;
  
  const [selectedCompanies, setSelectedCompanies] = React.useState<Company[]>([]);
  const [isInitialLoad, setIsInitialLoad] = React.useState(true);
  
  React.useEffect(() => {
    if (user?.allowedCompanies && user.company && isInitialLoad) {
      try {
        const storedCompanies = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedCompanies) {
          const parsedCompanies = JSON.parse(storedCompanies);
          const validStoredCompanies = parsedCompanies.filter((sc: Company) => 
            user.allowedCompanies.some(ac => ac.id === sc.id)
          );
          if (validStoredCompanies.length > 0) {
            setSelectedCompanies(validStoredCompanies);
          } else {
             setSelectedCompanies([user.company]);
          }
        } else {
          setSelectedCompanies([user.company]);
        }
      } catch (error) {
        console.error("Failed to process selected companies from localStorage", error);
        setSelectedCompanies([user.company]);
      }
      setIsInitialLoad(false);
    } else if (user?.company && isInitialLoad) {
        setSelectedCompanies([user.company]);
        setIsInitialLoad(false);
    }
  }, [user, isInitialLoad]);


  React.useEffect(() => {
    if (!isInitialLoad) {
      try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(selectedCompanies));
      } catch (error) {
          console.error("Failed to save selected companies to localStorage", error);
      }
    }
  }, [selectedCompanies, isInitialLoad]);

  if (isInitialLoad) {
     return <div className="flex h-screen items-center justify-center">Cargando...</div>;
  }

  return (
    <DashboardProvider allProjects={allProjects} selectedCompanies={selectedCompanies}>
        <AppShell 
            selectedCompanies={selectedCompanies}
            onCompanyChange={setSelectedCompanies}
        >
            {children}
        </AppShell>
    </DashboardProvider>
  );
}
