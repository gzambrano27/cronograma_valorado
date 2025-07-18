
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
  
  // Effect to initialize selectedCompanies from localStorage or user's default company
  React.useEffect(() => {
    if (user?.allowedCompanies && user.company && isInitialLoad) {
      try {
        const storedCompanies = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedCompanies) {
          const parsedCompanies = JSON.parse(storedCompanies);
          // Ensure stored companies are still valid for the user
          const validStoredCompanies = parsedCompanies.filter((sc: Company) => 
            user.allowedCompanies.some(ac => ac.id === sc.id)
          );
          if (validStoredCompanies.length > 0) {
            setSelectedCompanies(validStoredCompanies);
          } else {
             // If stored companies are invalid (e.g., user permissions changed), fallback to default
             setSelectedCompanies([user.company]);
          }
        } else {
          // If nothing in storage, use the user's default company
          setSelectedCompanies([user.company]);
        }
      } catch (error) {
        console.error("Failed to process selected companies from localStorage", error);
        setSelectedCompanies([user.company]);
      }
      setIsInitialLoad(false);
    } else if (user?.company && isInitialLoad) {
        // Fallback for users without allowedCompanies list, just use their main company
        setSelectedCompanies([user.company]);
        setIsInitialLoad(false);
    }
  }, [user, isInitialLoad]);


  // Effect to save selectedCompanies to localStorage whenever they change
  React.useEffect(() => {
    // Only save to localStorage after the initial load to avoid overwriting on startup
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
    <DashboardProvider value={{ allProjects, selectedCompanies }}>
        <AppShell 
            allProjects={allProjects} 
            selectedCompanies={selectedCompanies}
            onCompanyChange={setSelectedCompanies}
        >
            {children}
        </AppShell>
    </DashboardProvider>
  );
}
