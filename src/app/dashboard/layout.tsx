
'use client';

import { getProjects } from "@/lib/data";
import { ConnectionError } from '@/components/layout/connection-error';
import { DashboardProvider } from '@/hooks/use-dashboard-context';
import AuthLayoutClient from "@/components/layout/auth-layout-client";
import { checkDbConnection } from "@/lib/db";
import { useEffect, useState } from "react";
import type { Project } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/use-session";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isDbConnected, setIsDbConnected] = useState<boolean | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const router = useRouter();
  const { session, isLoading } = useSession();

  useEffect(() => {
    const checkConnection = async () => {
      const connected = await checkDbConnection();
      setIsDbConnected(connected);
      if (connected) {
        const fetchedProjects = await getProjects();
        setProjects(fetchedProjects);
      }
    };
    checkConnection();
  }, []);

  useEffect(() => {
    if (!isLoading && !session.isLoggedIn) {
      router.replace('/login');
    }
  }, [isLoading, session.isLoggedIn, router]);

  if (isLoading || isDbConnected === null) {
    return <div className="flex h-screen items-center justify-center">Cargando...</div>;
  }
  
  if (!isDbConnected) {
    return <ConnectionError />;
  }

  if (!session.isLoggedIn) {
    return null; // or a loading spinner, as the redirect will happen
  }

  return (
    <DashboardProvider allProjects={projects}>
      <AuthLayoutClient>
          {children}
      </AuthLayoutClient>
    </DashboardProvider>
  );
}
