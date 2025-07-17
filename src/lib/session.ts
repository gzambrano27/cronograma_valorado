
'use server';
import 'server-only';

import {-private_getIronSession as getIronSession} from 'iron-session';
import type {IronSession, IronSessionData} from 'iron-session';
import {cookies} from 'next/headers';
import {SessionUser} from './types';

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
}

export async function getSession(): Promise<IronSession<SessionData>> {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  if (!session.isLoggedIn) {
    session.isLoggedIn = false;
  }
  return session;
}
