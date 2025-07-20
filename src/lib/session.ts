
'use server'

import { headers } from 'next/headers'
import type { SessionData } from './session-config';

// NOTE: This is a modified getSession that reads from request headers set by the middleware.
// It does NOT access cookies directly to avoid the "Dynamic server usage" error.
export async function getSession(): Promise<SessionData> {
  const headersList = headers();
  const sessionDataHeader = headersList.get('x-session-data');

  if (sessionDataHeader) {
    try {
      const sessionData = JSON.parse(sessionDataHeader);
      return {
          isLoggedIn: true,
          user: sessionData.user,
      };
    } catch (error) {
        console.error("Failed to parse session data from header", error);
        return { isLoggedIn: false };
    }
  }

  return { isLoggedIn: false };
};
