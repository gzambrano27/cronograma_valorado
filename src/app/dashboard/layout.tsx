
import type { Project } from '@/lib/types';
import { getProjects } from "@/lib/data";
import { getSession } from '@/lib/session';
import AuthLayoutClient from '@/components/layout/auth-layout-client';
import { checkDbConnection } from '@/lib/db';
import { ConnectionError } from '@/components/layout/connection-error';
import { DashboardProvider } from '@/hooks/use-dashboard-context';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  const isDbConnected = await checkDbConnection();
  if (!isDbConnected) {
    return <ConnectionError />;
  }

  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect('/login');
  }

  const allProjects = await getProjects();

  return (
    <DashboardProvider allProjects={allProjects}>
      <AuthLayoutClient session={session}>
          {children}
      </AuthLayoutClient>
    </DashboardProvider>
  );
}
