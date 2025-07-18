
'use server';
import 'server-only';

import { getIronSession, type IronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from './session-config';
import type { SessionData } from './session-config';


// This function gets the raw session object. Use it only in server actions to modify the session.
export async function getIronSessionInstance(): Promise<IronSession<SessionData>> {
    const cookieStore = cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

    if (!session.isLoggedIn) {
        session.isLoggedIn = false;
    }
    return session;
}


// This function gets a plain, serializable session data object. Use this in layouts and pages.
export async function getSession(): Promise<SessionData> {
  const session = await getIronSessionInstance();

  // Return a plain object, not the session instance
  return {
    isLoggedIn: session.isLoggedIn,
    user: session.user,
    uid: session.uid,
    password: session.password,
  };
}
