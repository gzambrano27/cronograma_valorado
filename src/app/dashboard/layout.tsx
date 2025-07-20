
'use server';

import { getProjects } from "@/lib/data";
import { ConnectionError } from '@/components/layout/connection-error';
import { DashboardProvider } from '@/hooks/use-dashboard-context';
import AuthLayoutClient from "@/components/layout/auth-layout-client";
import { checkDbConnection } from "@/lib/db";
import { cookies } from 'next/headers';
import { redirect } from "next/navigation";
import type { SessionData } from "@/lib/types";

// This is now a pure Server Component.
// All data fetching and session checking happens on the server before rendering.

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

  // 2. Check session from localStorage via a cookie proxy (if needed) or handle on client.
  // For our current setup, the client-side `useSession` hook will handle redirects.
  // We'll add a server-side check for robustness.
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('userSession');
  let session: SessionData | null = null;
  
  if (sessionCookie?.value) {
    try {
      session = JSON.parse(sessionCookie.value);
    } catch {
      // Invalid JSON, treat as not logged in
      session = null;
    }
  }

  if (!session?.isLoggedIn) {
     redirect('/login');
  }
  
  // 3. Fetch initial data on the server.
  const projects = await getProjects();

  return (
    <DashboardProvider allProjects={projects}>
      <AuthLayoutClient>
          {children}
      </AuthLayoutClient>
    </DashboardProvider>
  );
}
