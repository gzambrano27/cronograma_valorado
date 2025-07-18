
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from '@/lib/session';

export const middleware = async (req: NextRequest) => {
  const { pathname } = req.nextUrl;
  const session = await getSession();

  const isPublicRoute = pathname === '/login';
  const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/projects') || pathname.startsWith('/settings');

  // If user is logged in and tries to access a public route (like /login),
  // redirect them to the dashboard.
  if (session.isLoggedIn && isPublicRoute) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // If user is not logged in and is trying to access a protected route,
  // redirect them to the login page.
  if (!session.isLoggedIn && isProtectedRoute) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Special case for the root path
  if (pathname === '/') {
    const targetUrl = new URL(session.isLoggedIn ? '/dashboard' : '/login', req.url);
    return NextResponse.redirect(targetUrl);
  }

  return NextResponse.next();
};

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images|manifest.json).*)'],
};
