
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware is now much simpler and does not handle session logic.
// All redirection and session checks are handled in layouts and pages.
export const middleware = async (req: NextRequest) => {
  return NextResponse.next();
};

export const config = {
  // Matcher for all routes except static assets and API routes
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images|manifest.json).*)'],
};
