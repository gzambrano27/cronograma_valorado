
'use client';
import AppShell from '@/components/layout/app-shell';
import { ConnectionError } from '@/components/layout/connection-error';
import { DashboardProvider } from '@/hooks/use-dashboard-context';
import { useSession } from '@/hooks/use-session';
import { checkDbConnection } from '@/lib/db';
import type { Company, Project } from '@/lib/types';
import React from 'react';
import { getProjects } from "@/lib/data";

const LOCAL_STORAGE_KEY = 'selectedCompanies';

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [dbChecked, setDbChecked] = React.useState(false);
  const [isDbConnected, setIsDbConnected] = React.useState(false);

  const { session } = useSession();
  const user = session?.user;
  
  const [selectedCompanies, setSelectedCompanies] = React.useState<Company[]>([]);
  const [isInitialLoad, setIsInitialLoad] = React.useState(true);
  const [allProjects, setAllProjects] = React.useState<Project[]>([]);
  
  React.useEffect(() => {
    const check = async () => {
        const connected = await checkDbConnection();
        setIsDbConnected(connected);
        setDbChecked(true);
    }
    check();
  }, [])
  
  React.useEffect(() => {
    const fetchProjects = async () => {
      if (session.isLoggedIn) {
        try {
          const projects = await getProjects();
          setAllProjects(projects);
        } catch (error) {
          console.error("Failed to fetch projects:", error);
        }
      }
    };
    fetchProjects();
  }, [session.isLoggedIn]);
  
  // Effect to initialize selectedCompanies from localStorage or user's default company
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
    }
  }, [user, isInitialLoad]);


  // Effect to save selectedCompanies to localStorage whenever they change
  React.useEffect(() => {
    if (!isInitialLoad) {
      try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(selectedCompanies));
      } catch (error) {
          console.error("Failed to save selected companies to localStorage", error);
      }
    }
  }, [selectedCompanies, isInitialLoad]);

  if (!dbChecked || isInitialLoad) {
     return <div className="flex h-screen items-center justify-center">Cargando...</div>;
  }

  if (!isDbConnected) {
    return <ConnectionError />;
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
