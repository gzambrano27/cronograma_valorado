
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import React from 'react';
import { ThemeProvider } from '@/components/layout/theme-provider';

// Layout raíz de la aplicación.
// Este es el layout más básico que envuelve a todas las páginas.
// Se mantiene simple para evitar errores de hidratación.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Carga de fuentes desde Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet" />
        
        {/* Metadatos y título de la aplicación */}
        <meta name="theme-color" content="#FFFFFF" />
         <title>Centro de Aplicaciones</title>
         <meta name="description" content="Una aplicación para valorar y gestionar el cronograma de proyectos." />
         <link rel="icon" href="data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%20fill='none'%20stroke='currentColor'%20stroke-width='2'%20stroke-linecap='round'%20stroke-linejoin='round'%3E%3Crect%20width='18'%20height='18'%20x='3'%20y='3'%20rx='2'/%3E%3Cpath%20d='M7%207h3v3H7z'/%3E%3Cpath%20d='M14%207h3v3h-3z'/%3E%3Cpath%20d='M7%2014h3v3H7z'/%3E%3Cpath%20d='M14%2014h3v3h-3z'/%3E%3C/svg%3E" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
