'use server';
import 'server-only';

import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, type SessionData } from './session-config';

// This function gets a plain, serializable session data object. Use this in layouts and pages.
export async function getSession(): Promise<SessionData> {
  const cookieStore = cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

  // Return a plain object, not the session instance
  return {
    isLoggedIn: session.isLoggedIn || false,
    user: session.user,
    uid: session.uid,
    password: session.password,
  };
}
