
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import AppShell from '@/components/layout/app-shell';
import { getProjects } from '@/lib/data';
import { ThemeProvider } from '@/components/layout/theme-provider';
import React from 'react';
import type { Project } from '@/lib/types';
import { checkDbConnection } from '@/lib/db';
import { ConnectionError } from '@/components/layout/connection-error';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDbConnected = await checkDbConnection();

  let projects: Project[] = [];
  if (isDbConnected) {
    projects = await getProjects();
  }
  
  const title = "Menú";

  return (
    <html lang="en" suppressHydrationWarning>
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
            <AppShell projects={projects} title={title}>
              {children}
            </AppShell>
          ) : (
            <ConnectionError />
          )}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
