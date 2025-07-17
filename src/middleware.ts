
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getIronSession } from 'iron-session/edge';
import { sessionOptions, type SessionData } from '@/lib/session';

export const middleware = async (req: NextRequest) => {
  const res = NextResponse.next();
  const session = await getIronSession<SessionData>(req, res, sessionOptions);

  const { isLoggedIn } = session;
  const { pathname } = req.nextUrl;

  const publicRoutes = ['/login', '/api/auth/login'];

  if (publicRoutes.includes(pathname)) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return res;
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  
  // If user is logged in and trying to access the root, redirect to dashboard
  if (pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return res;
};

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images|manifest.json).*)'],
};
