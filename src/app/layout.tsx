
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
        <meta name="theme-color" content="#3F51B5" />
         <title>Centro de Aplicaciones</title>
         <meta name="description" content="Una aplicación para valorar y gestionar el cronograma de proyectos." />
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
