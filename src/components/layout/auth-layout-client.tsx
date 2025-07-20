
'use client';
import AppShell from '@/components/layout/app-shell';
import { useDashboard } from '@/hooks/use-dashboard-context';
import type { Company, SessionData } from '@/lib/types';
import React, { useEffect, useState } from 'react';
import { useSession } from '@/hooks/use-session';

const LOCAL_STORAGE_KEY = 'selectedCompanies';

export default function AuthLayoutClient({
  children,
  session: serverSession
}: Readonly<{
  children: React.ReactNode;
  session: SessionData; // This is now a plain object from the server
}>) {
  const user = serverSession?.user;
  const { allProjects, selectedCompanies, setSelectedCompanies } = useDashboard();
  const { setSession } = useSession(); // Get the setter from the global context
  
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Set the session in the global context provider once on initial load
  useEffect(() => {
    setSession(serverSession);
  }, [serverSession, setSession]);


  useEffect(() => {
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
  }, [user, isInitialLoad, setSelectedCompanies]);


  useEffect(() => {
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
    <AppShell 
        allProjects={allProjects}
        selectedCompanies={selectedCompanies}
        onCompanyChange={setSelectedCompanies}
    >
        {children}
    </AppShell>
  );
}
