
'use server';
import 'server-only';

import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, type SessionData } from './session-config';


// This function gets a plain, serializable session data object.
// It's safe to use in layouts and pages.
export async function getSession(): Promise<SessionData> {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);

  // If the session object doesn't exist or isn't logged in, return a default state
  if (!session || !session.isLoggedIn) {
    return { isLoggedIn: false };
  }

  // Return a plain object, not the session instance
  return {
    isLoggedIn: session.isLoggedIn,
    user: session.user,
    uid: session.uid,
    password: session.password,
  };
}
