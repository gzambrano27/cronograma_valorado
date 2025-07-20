
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware is now much simpler. It only handles basic routing.
// Authentication checks are now primarily handled on the client-side
// or in the specific page/layout that needs protection.

export const middleware = async (req: NextRequest) => {
  const { pathname } = req.nextUrl;

  // You can add logic here for redirects that don't depend on session state,
  // for example, redirecting from a legacy URL to a new one.
  
  // The main responsibility is just to pass the request along.
  return NextResponse.next();
};

export const config = {
  // Matcher for all routes except static assets and API routes
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images|manifest.json).*)'],
};
