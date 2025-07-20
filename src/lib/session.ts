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
  // This avoids having to check for `session.isLoggedIn` elsewhere.
  if (!session.isLoggedIn) {
    return { isLoggedIn: false };
  }

  return session;
});
