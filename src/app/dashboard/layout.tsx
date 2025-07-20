
'use server';

import { getProjects } from "@/lib/data";
import { ConnectionError } from '@/components/layout/connection-error';
import { DashboardProvider } from '@/hooks/use-dashboard-context';
import AuthLayoutClient from "@/components/layout/auth-layout-client";
import { checkDbConnection } from "@/lib/db";

// This is a pure Server Component by default.
// All data fetching happens on the server before rendering.

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 1. Check database connection on the server.
  const isDbConnected = await checkDbConnection();
  if (!isDbConnected) {
    return <ConnectionError />;
  }
  
  // 2. Fetch initial data on the server.
  const projects = await getProjects();

  return (
    <DashboardProvider allProjects={projects}>
      <AuthLayoutClient>
          {children}
      </AuthLayoutClient>
    </DashboardProvider>
  );
}
