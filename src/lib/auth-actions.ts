
'use server';

import 'server-only';
import { z } from 'zod';
import { getOdooClient } from './odoo-client';
import type { Company, UserGroupInfo, LoginResult } from './types';
import { query } from './db';

const LoginSchema = z.object({
  email: z.string().min(1, 'Por favor ingrese su usuario.'),
  password: z.string().min(1, 'La contraseña es requerida.'),
});

export const getTranslatedName = (nameField: any): string => {
  if (typeof nameField === 'string') {
    return nameField;
  }
  if (typeof nameField === 'object' && nameField !== null && !Array.isArray(nameField)) {
    return nameField.es_EC || nameField.en_US || 'N/A';
  }
  if (Array.isArray(nameField) && nameField.length > 1) {
    return getTranslatedName(nameField[1]);
  }
  return 'N/A';
};

export async function checkUserIsManager(userId: number): Promise<boolean> {
  const userGroups = await query<UserGroupInfo>(`
    SELECT
      ru.login AS usuario,
      rg.category_id AS categoria_id,
      rgc.name AS nombre_categoria,
      rg.id AS grupo_id,
      rg.name AS nombre_grupo
    FROM
      res_users ru
    JOIN
      res_groups_users_rel rel ON ru.id = rel.uid
    JOIN
      res_groups rg ON rg.id = rel.gid
    LEFT JOIN
      ir_module_category rgc ON rg.category_id = rgc.id
    WHERE
      ru.id = $1;
  `, [userId]);

  return userGroups.some(group =>
    getTranslatedName(group.nombre_categoria) === 'Apus' &&
    getTranslatedName(group.nombre_grupo) === 'Gerente'
  );
}

export async function login(prevState: LoginResult | undefined, formData: FormData): Promise<LoginResult> {
  const validatedFields = LoginSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return { success: false, error: validatedFields.error.errors.map((e) => e.message).join(', ') };
  }

  const { email, password } = validatedFields.data;

  try {
    const odooClient = getOdooClient();
    const uid = await odooClient.authenticate(email, password);

    if (!uid) {
      return { success: false, error: 'Credenciales inválidas.' };
    }

    const userDetails = await odooClient.executeKw<any[]>('res.users', 'search_read',
      [[['id', '=', uid]]],
      { fields: ['name', 'login', 'partner_id', 'company_id', 'company_ids'] }
    );

    if (!userDetails || userDetails.length === 0) {
      return { success: false, error: 'No se pudo encontrar la información del usuario.' };
    }

    const user = userDetails[0];
    const isManager = await checkUserIsManager(user.id);

    const allowedCompanyIds = user.company_ids || [];
    let allowedCompanies: Company[] = [];
    if (allowedCompanyIds.length > 0) {
      const companiesData = await odooClient.executeKw<any[]>('res.company', 'search_read',
        [[['id', 'in', allowedCompanyIds]]],
        { fields: ['name'] }
      );
      allowedCompanies = companiesData.map(c => ({
        id: c.id,
        name: getTranslatedName(c.name),
      }));
    }

    const currentCompany: Company = {
      id: user.company_id[0],
      name: getTranslatedName(user.company_id[1]),
    };

    return {
      success: true,
      user: {
        id: user.id,
        name: getTranslatedName(user.name),
        email: user.login,
        company: currentCompany,
        allowedCompanies: allowedCompanies,
        isManager,
      },
    };

  } catch (error: any) {
    console.error(`Error en el inicio de sesión para ${email}:`, error);
    if (error.message && error.message.includes('AccessDenied')) {
      return { success: false, error: 'Credenciales inválidas.' };
    }
    const odooUrl = process.env.ODOO_URL || 'URL no configurada';
    if (error.message && error.message.includes('ECONNREFUSED')) {
      return { success: false, error: `No se pudo conectar al servidor de Odoo en ${odooUrl}. Verifique la URL o el servidor.` };
    }
    if (error.faultString) {
      return { success: false, error: `Error de Odoo: ${error.faultString}` };
    }
    return { success: false, error: 'Ocurrió un error inesperado al conectar con Odoo.' };
  }
}

export function logout() {
  // This is now a client-side operation handled in useSession hook
  // by clearing localStorage. This function can be kept for semantics
  // but doesn't need to be a server action.
}
