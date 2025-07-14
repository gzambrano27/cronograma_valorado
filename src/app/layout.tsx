
'use client'
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import AppShell from '@/components/layout/app-shell';
import { getProjects } from '@/lib/data';
import { ThemeProvider } from '@/components/layout/theme-provider';
import React, { useState, useEffect } from 'react';
import type { Project } from '@/lib/types';


const SIDEBAR_COOKIE_NAME = "sidebar_state";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const fetchedProjects = await getProjects();
      setProjects(fetchedProjects);
      
      const sidebarCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith(`${SIDEBAR_COOKIE_NAME}=`))
        ?.split('=')[1];
      setSidebarOpen(sidebarCookie ? sidebarCookie === 'true' : true);
    }
    fetchData();
  }, []);

  const title = "ProjectValuator";

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet" />
        <meta name="theme-color" content="#3F51B5" />
         <title>ProjectValuator</title>
         <meta name="description" content="Evalúa tus proyectos con precisión." />
         <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AppShell projects={projects} title={title} sidebarOpen={sidebarOpen}>
            {children}
          </AppShell>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
