import type { SessionOptions } from 'iron-session';
import type { SessionUser } from './types';

/**
 * Estructura de datos que guardaremos en la sesión del usuario.
 */
export interface SessionData {
  isLoggedIn: boolean;
  user?: SessionUser;
  uid?: number;
  password?: string;
}

/**
 * Validación obligatoria para entorno seguro: clave secreta para la cookie.
 */
const password = process.env.SECRET_COOKIE_PASSWORD;

if (!password || password.length < 32) {
  throw new Error(
    'Missing or invalid SECRET_COOKIE_PASSWORD environment variable. Use `openssl rand -base64 32` to generate a strong secret.'
  );
}

/**
 * Configuración de la sesión (usada por iron-session).
 */
export const sessionOptions: SessionOptions = {
  password,
  cookieName: 'project-valuator-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
};
