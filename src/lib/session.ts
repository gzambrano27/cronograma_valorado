
'use server'

import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { sessionOptions, type SessionData } from './session-config';

// The cache function is used to memoize the session data for the duration of a single request.
// This ensures that `cookies()` is only called once per request, resolving the Next.js dynamic usage error.
export const getSession = cache(async (): Promise<SessionData> => {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);

  // If the session object doesn't exist or isn't logged in, return a default state.
  if (!session.isLoggedIn) {
    return { isLoggedIn: false };
  }

  // IMPORTANT: Return a plain object, not the iron-session object itself.
  // This prevents the "Only plain objects can be passed to Client Components" error.
  return {
    isLoggedIn: session.isLoggedIn,
    user: session.user,
  };
});
