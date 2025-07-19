
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from '@/lib/session';

export const middleware = async (req: NextRequest) => {
  const { pathname } = req.nextUrl;

  // The root path '/' is special and needs to be handled.
  // We'll let a client component on the page handle the redirect
  // to avoid calling getSession here for every single request.
  if (pathname === '/') {
    return NextResponse.next();
  }

  // For any other path, we check if it's a protected route.
  const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/projects') || pathname.startsWith('/settings');

  if (isProtectedRoute) {
    // We only call getSession for protected routes.
    const session = await getSession();
    if (!session.isLoggedIn) {
      // If the user is not logged in, redirect to the login page.
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
};

export const config = {
  // This matcher ensures the middleware runs on all paths except for static assets and API routes.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images|manifest.json).*)'],
};
