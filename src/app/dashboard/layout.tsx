
import type { Project } from '@/lib/types';
import { getProjects } from "@/lib/data";
import { getSession } from '@/lib/session';
import AuthLayoutClient from '@/components/layout/auth-layout-client';
import { checkDbConnection } from '@/lib/db';
import { ConnectionError } from '@/components/layout/connection-error';
import { DashboardProvider } from '@/hooks/use-dashboard-context';

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  const isDbConnected = await checkDbConnection();
  if (!isDbConnected) {
    return <ConnectionError />;
  }

  // getSession now returns a plain object, safe to pass to client components
  const session = await getSession();
  
  // Note: Redirection logic is now handled by the middleware.
  // This layout can assume a logged-in user is present.

  const allProjects = await getProjects();

  return (
    <DashboardProvider allProjects={allProjects}>
      <AuthLayoutClient session={session}>
          {children}
      </AuthLayoutClient>
    </DashboardProvider>
  );
}
