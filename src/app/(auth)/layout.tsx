
import type { Project } from '@/lib/types';
import { getProjects } from "@/lib/data";
import { getSession } from '@/lib/session';
import AuthLayoutClient from '@/components/layout/auth-layout-client';
import { checkDbConnection } from '@/lib/db';
import { ConnectionError } from '@/components/layout/connection-error';

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  const isDbConnected = await checkDbConnection();
  if (!isDbConnected) {
    return <ConnectionError />;
  }

  const session = await getSession();
  const allProjects = await getProjects();

  return (
    <AuthLayoutClient session={session} allProjects={allProjects}>
        {children}
    </AuthLayoutClient>
  );
}
