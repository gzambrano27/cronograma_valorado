
'use server';

import 'server-only';
import { z } from 'zod';
import { query } from './db';
import { redirect } from 'next/navigation';
import { getSession } from './session';
import { SessionUser } from './types';
import { pbkdf2Sync, timingSafeEqual } from 'crypto';

const LoginSchema = z.object({
  email: z.string().email('Por favor ingrese un correo válido.'),
  password: z.string().min(1, 'La contraseña es requerida.'),
});

async function verifyPassword(password: string, hashedPasswordString: string): Promise<boolean> {
  const parts = hashedPasswordString.split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2-sha512') {
    // Fallback for plain text passwords if needed for testing, NOT recommended for production
    return password === hashedPasswordString;
  }
  
  const iterations = parseInt(parts[1], 10);
  const salt = Buffer.from(parts[2], 'hex');
  const storedHash = Buffer.from(parts[3], 'hex');

  const derivedKey = pbkdf2Sync(password, salt, iterations, 64, 'sha512');
  
  if (derivedKey.length !== storedHash.length) {
    return false;
  }

  return timingSafeEqual(derivedKey, storedHash);
}

export async function login(prevState: { error: string } | undefined, formData: FormData) {
  const validatedFields = LoginSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return { error: validatedFields.error.errors.map((e) => e.message).join(', ') };
  }

  const { email, password } = validatedFields.data;

  try {
    const users = await query<{ id: number; name: string; login: string; password?: string }>(
      'SELECT id, name, login, password FROM res_users WHERE login = $1 AND active = TRUE LIMIT 1',
      [email]
    );

    const user = users[0];

    if (!user || !user.password) {
      return { error: 'Credenciales inválidas.' };
    }
    
    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
      return { error: 'Credenciales inválidas.' };
    }

    const session = await getSession();
    session.isLoggedIn = true;
    session.user = {
      id: user.id,
      name: user.name,
      email: user.login,
    };
    await session.save();
    
  } catch (error) {
    console.error('Login error:', error);
    return { error: 'Ocurrió un error inesperado. Por favor, intente de nuevo.' };
  }
  
  redirect('/dashboard');
}

export async function logout() {
  const session = await getSession();
  session.destroy();
  redirect('/login');
}
