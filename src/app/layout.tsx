
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import AppShell from '@/components/layout/app-shell';
import { ThemeProvider } from '@/components/layout/theme-provider';
import React from 'react';
import type { Project } from '@/lib/types';
import { checkDbConnection } from '@/lib/db';
import { ConnectionError } from '@/components/layout/connection-error';
import { getSession } from './lib/session';
import { getProjects } from './lib/data';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDbConnected = await checkDbConnection();
  const session = await getSession();

  let projects: Project[] = [];
  if (isDbConnected && session.isLoggedIn) {
    try {
      projects = await getProjects();
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    }
  }
  
  const title = "Menú";

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet" />
        <meta name="theme-color" content="#3F51B5" />
         <title>Centro de Aplicaciones</title>
         <meta name="description" content="Evalúa tus proyectos con precisión." />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {isDbConnected ? (
             session.isLoggedIn ? (
                <AppShell projects={projects} title={title} user={session.user}>
                  {children}
                </AppShell>
              ) : (
                children
              )
          ) : (
            <ConnectionError />
          )}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
