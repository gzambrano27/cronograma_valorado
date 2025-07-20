
'use client';
import AppShell from '@/components/layout/app-shell';
import { useDashboard } from '@/hooks/use-dashboard-context';
import type { Company } from '@/lib/types';
import React, { useEffect, useState } from 'react';
import { useSession } from '@/hooks/use-session';
import { usePathname, useRouter } from 'next/navigation';

const LOCAL_STORAGE_KEY_COMPANIES = 'selectedCompanies';

export default function AuthLayoutClient({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { session, isLoading } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const user = session.user;
  const { allProjects, selectedCompanies, setSelectedCompanies } = useDashboard();
  
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    if (isLoading) {
      return; // Wait for the session to load
    }
    if (!session.isLoggedIn && pathname !== '/login') {
      router.replace('/login');
    }
  }, [session.isLoggedIn, isLoading, router, pathname]);
  
  useEffect(() => {
    if (user?.allowedCompanies && user.company && isInitialLoad) {
      try {
        const storedCompanies = localStorage.getItem(LOCAL_STORAGE_KEY_COMPANIES);
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
    if (!isInitialLoad && selectedCompanies.length > 0) {
      try {
          localStorage.setItem(LOCAL_STORAGE_KEY_COMPANIES, JSON.stringify(selectedCompanies));
      } catch (error) {
          console.error("Failed to save selected companies to localStorage", error);
      }
    }
  }, [selectedCompanies, isInitialLoad]);

  if (isLoading || !session.isLoggedIn) {
     return (
        <div className="flex h-screen items-center justify-center">
            <p>Cargando sesión...</p>
        </div>
    );
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
