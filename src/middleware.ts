
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, type SessionData } from './lib/session-config';

const protectedRoutes = ['/dashboard'];

export const middleware = async (req: NextRequest) => {
  // We need to get the session directly here for route protection.
  const session = await getIronSession<SessionData>(req.cookies, sessionOptions);
  const { isLoggedIn } = session;
  const { pathname } = req.nextUrl;
  
  // If user is logged in and tries to access login page, redirect to dashboard
  if (isLoggedIn && pathname.startsWith('/login')) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // If user is not logged in and tries to access a protected route, redirect to login
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  if (!isLoggedIn && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  
  // If no redirection is needed, just continue to the requested path.
  return NextResponse.next();
};

export const config = {
  // Matcher for all routes except static assets and API routes
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images|manifest.json).*)'],
};
