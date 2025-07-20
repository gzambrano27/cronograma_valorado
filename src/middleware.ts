
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, type SessionData } from './lib/session-config';

const protectedRoutes = ['/dashboard'];

export const middleware = async (req: NextRequest) => {
  const session = await getIronSession<SessionData>(req.cookies, sessionOptions);
  const { user } = session;
  const { pathname } = req.nextUrl;
  
  // If user is logged in and tries to access login page, redirect to dashboard
  if (user && pathname.startsWith('/login')) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // If user is not logged in and tries to access a protected route, redirect to login
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // For all server-side requests to protected routes, pass session data via headers
  // This avoids components needing to call `cookies()` themselves.
  const requestHeaders = new Headers(req.headers);
  if (user) {
    requestHeaders.set('x-session-data', JSON.stringify({ user }));
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
};

export const config = {
  // Matcher for all routes except static assets and API routes
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images|manifest.json).*)'],
};
