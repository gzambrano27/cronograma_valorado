
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from '@/lib/session';

export const middleware = async (req: NextRequest) => {
  const { pathname } = req.nextUrl;
  const session = await getSession();

  // If user is logged in and tries to access login page, redirect to dashboard
  if (session.isLoggedIn && pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // If user is not logged in and tries to access a protected route, redirect to login
  if (!session.isLoggedIn && (pathname.startsWith('/dashboard') || pathname.startsWith('/settings'))) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
};

export const config = {
  // Matcher for all routes except static assets and API routes
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images|manifest.json).*)'],
};
