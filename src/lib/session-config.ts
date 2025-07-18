import type { IronSessionOptions } from 'iron-session';
import type { SessionUser } from './types';

const password = process.env.SECRET_COOKIE_PASSWORD;

if (!password) {
  throw new Error(
    'Missing SECRET_COOKIE_PASSWORD environment variable. Use `openssl rand -base64 32` to generate a secret.'
  );
}

export const sessionOptions: IronSessionOptions = {
  password,
  cookieName: 'project-valuator-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
};

export interface SessionData {
  isLoggedIn: boolean;
  user?: SessionUser;
  uid?: number;
  password?: string;
}
