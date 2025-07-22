
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import React from 'react';

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
         <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect width='18' height='18' x='3' y='3' rx='2'/><path d='M7 7h3v3H7z'/><path d='M14 7h3v3h-3z'/><path d='M7 14h3v3H7z'/><path d='M14 14h3v3h-3z'/></svg>" />
      </head>
      <body className="font-body antialiased">
        {/* El children representa el contenido de la página actual */}
        {children}
        {/* El Toaster es el componente que muestra las notificaciones (toasts) */}
        <Toaster />
      </body>
    </html>
  );
}
