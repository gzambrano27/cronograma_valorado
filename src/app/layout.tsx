import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import AppShell from '@/components/layout/app-shell';
import { getProjects } from '@/lib/data';
import { ThemeProvider } from '@/components/layout/theme-provider';
import { cookies } from 'next/headers';

export const metadata: Metadata = {
  title: 'Cronograma',
  description: 'Evalúa tus proyectos con precisión.',
};

const SIDEBAR_COOKIE_NAME = "sidebar_state";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const projects = await getProjects();
  const title = "Cronograma";
  const cookieStore = cookies();
  const sidebarState = cookieStore.get(SIDEBAR_COOKIE_NAME);
  const defaultOpen = sidebarState ? sidebarState.value === 'true' : true;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AppShell projects={projects} title={title} sidebarOpen={defaultOpen}>
            {children}
          </AppShell>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
