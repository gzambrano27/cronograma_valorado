
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// El middleware en Next.js se ejecuta antes de que una solicitud se complete.
// Es útil para redirecciones, reescritura de URLs, añadir cabeceras, etc.

// En esta aplicación, el middleware es muy simple.
// La lógica de autenticación se maneja principalmente en el lado del cliente
// y en los layouts específicos que requieren protección.
export const middleware = async (req: NextRequest) => {
  const { pathname } = req.nextUrl;

  // Aquí se podría añadir lógica para redirecciones que no dependen del estado
  // de la sesión, como por ejemplo, de una URL antigua a una nueva.
  
  // La responsabilidad principal es simplemente pasar la solicitud.
  return NextResponse.next();
};

// El `matcher` define las rutas en las que se ejecutará este middleware.
// Esta configuración excluye rutas de archivos estáticos y de la API.
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images|manifest.json).*)'],
};
