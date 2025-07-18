
'use server';

import 'server-only';
import { z } from 'zod';
import { redirect } from 'next/navigation';
import { getSession } from './session';
import { getOdooClient } from './odoo-client';
import type { Company } from './types';

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

    const userDetails = await odooClient.executeKw<any[]>('res.users', 'search_read',
        [[['id', '=', uid]]], 
        { fields: ['name', 'login', 'partner_id', 'company_id', 'company_ids'] }
    );


    if (!userDetails || userDetails.length === 0) {
        return { error: 'No se pudo encontrar la información del usuario.' };
    }
    
    const user = userDetails[0];

    const allowedCompanyIds = user.company_ids;
    const companiesData = await odooClient.executeKw<any[]>('res.company', 'search_read',
        [[['id', 'in', allowedCompanyIds]]],
        { fields: ['name'] }
    );
    
    const allowedCompanies: Company[] = companiesData.map(c => ({ id: c.id, name: getTranslatedName(c.name) }));
    const currentCompany: Company = { id: user.company_id[0], name: getTranslatedName(user.company_id[1]) };

    const session = await getSession();
    session.isLoggedIn = true;
    session.user = {
      id: user.id,
      name: getTranslatedName(user.name),
      email: user.login,
      company: currentCompany,
      allowedCompanies: allowedCompanies,
    };
    session.uid = uid;
    session.password = password;
    await session.save();
    
  } catch (error: any) {
    console.error(`Error en el inicio de sesión para ${email}:`, error);
    if (error.message && error.message.includes('AccessDenied')) {
        return { error: 'Credenciales inválidas.' };
    }
    if (error.message && error.message.includes('ECONNREFUSED')) {
        const odooUrl = process.env.ODOO_URL || 'URL no configurada';
        return { error: `No se pudo conectar al servidor de Odoo en ${odooUrl}. Por favor, verifique la URL y que el servidor esté en ejecución.` };
    }
    return { error: 'Ocurrió un error inesperado al conectar con Odoo.' };
  }
  
  redirect('/dashboard');
}

export async function logout() {
  const session = await getSession();
  session.destroy();
  redirect('/login');
}
