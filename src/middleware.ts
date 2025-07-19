
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const middleware = async (req: NextRequest) => {
  const { pathname } = req.nextUrl;

  // The root path should be handled by the page itself to decide where to redirect.
  // Other protected routes will be handled by their respective layouts.
  // This middleware is now much simpler.
  
  // Example: You could add logic here for internationalization (i18n) redirects
  // or other logic that doesn't depend on session state.

  return NextResponse.next();
};

export const config = {
  // Matcher for all routes except static assets and API routes
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images|manifest.json).*)'],
};
