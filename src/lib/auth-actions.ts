
'use server';

import 'server-only';
import { z } from 'zod';
import { redirect } from 'next/navigation';
import { getSession } from './session';
import { OdooClient, getOdooClient } from './odoo-client';

const LoginSchema = z.object({
  email: z.string().email('Por favor ingrese un correo válido.'),
  password: z.string().min(1, 'La contraseña es requerida.'),
});

const getTranslatedName = (nameField: any): string => {
    if (typeof nameField === 'string') {
        return nameField;
    }
    if (typeof nameField === 'object' && nameField !== null) {
        return nameField.es_EC || nameField.en_US || 'N/A';
    }
    return 'N/A';
};

export async function login(prevState: { error: string } | undefined, formData: FormData) {
  const validatedFields = LoginSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return { error: validatedFields.error.errors.map((e) => e.message).join(', ') };
  }

  const { email, password } = validatedFields.data;

  try {
    const odooClient = getOdooClient();
    const uid = await odooClient.authenticate(email, password);

    if (!uid) {
      return { error: 'Credenciales inválidas.' };
    }

    // Authenticated successfully, now get user details
    const userDetails = await odooClient.executeKw<any[]>('res.users', 'search_read', [
        [['id', '=', uid]],
        { fields: ['name', 'login', 'partner_id'] }
    ]);

    if (!userDetails || userDetails.length === 0) {
        return { error: 'No se pudo encontrar la información del usuario.' };
    }
    
    const user = userDetails[0];

    const session = await getSession();
    session.isLoggedIn = true;
    session.user = {
      id: user.id,
      name: getTranslatedName(user.name),
      email: user.login,
    };
    session.uid = uid;
    session.password = password; // Store password for subsequent requests
    await session.save();
    
  } catch (error: any) {
    console.error('Login error:', error);
    // Provide a more user-friendly error message
    if (error.message && error.message.includes('AccessDenied')) {
        return { error: 'Credenciales inválidas.' };
    }
    return { error: 'Ocurrió un error inesperado al conectar con Odoo. Por favor, verifique la URL y la base de datos en la configuración.' };
  }
  
  redirect('/dashboard');
}

export async function logout() {
  const session = await getSession();
  session.destroy();
  redirect('/login');
}
