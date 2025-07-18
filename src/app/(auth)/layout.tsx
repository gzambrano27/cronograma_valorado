
import AppShell from '@/components/layout/app-shell';
import { ConnectionError } from '@/components/layout/connection-error';
import { checkDbConnection } from '@/lib/db';
import React from 'react';

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDbConnected = await checkDbConnection();

  if (!isDbConnected) {
    return <ConnectionError />;
  }

  return <AppShell>{children}</AppShell>;
}
