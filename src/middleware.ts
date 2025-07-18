
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { sessionOptions } from '@/lib/session-config';

export const middleware = async (req: NextRequest) => {
  const { pathname } = req.nextUrl;
  const sessionCookie = req.cookies.get(sessionOptions.cookieName);

  const publicRoutes = ['/login'];
  const isPublicRoute = publicRoutes.includes(pathname);

  // If user has a session cookie and tries to access a public route (like /login),
  // redirect them to the dashboard.
  if (sessionCookie && isPublicRoute) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // If user does not have a session cookie and is trying to access a protected route,
  // redirect them to the login page.
  if (!sessionCookie && !isPublicRoute) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Special case for the root path
  if (pathname === '/') {
    const targetUrl = new URL(sessionCookie ? '/dashboard' : '/login', req.url);
    return NextResponse.redirect(targetUrl);
  }


  return NextResponse.next();
};

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images|manifest.json).*)'],
};
