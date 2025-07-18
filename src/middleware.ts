
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import type { SessionData } from '@/lib/session';

const password = process.env.SECRET_COOKIE_PASSWORD;

if (!password) {
  // This should not happen in middleware if session.ts already checked, but it's good practice
  throw new Error('Missing SECRET_COOKIE_PASSWORD for middleware session.');
}

export const sessionOptions = {
  password,
  cookieName: 'project-valuator-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
};


export const middleware = async (req: NextRequest) => {
  const res = NextResponse.next();
  const session = await getIronSession<SessionData>(req.cookies, sessionOptions);

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
  
  if (pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return res;
};

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images|manifest.json).*)'],
};
