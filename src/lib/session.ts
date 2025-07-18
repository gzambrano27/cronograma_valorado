'use server';
import 'server-only';

import { getIronSession, type IronSession, type IronSessionData } from 'iron-session';
import { cookies } from 'next/headers';
import type { SessionUser } from './types';

const password = process.env.SECRET_COOKIE_PASSWORD;

if (!password) {
  throw new Error(
    'Missing SECRET_COOKIE_PASSWORD environment variable. Use `openssl rand -base64 32` to generate a secret.'
  );
}

export const sessionOptions = {
  password,
  cookieName: 'project-valuator-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
};

export interface SessionData extends IronSessionData {
  isLoggedIn: boolean;
  user?: SessionUser;
  uid?: number;
  password?: string;
}

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
