
import * as xmlrpc from 'xmlrpc';

const ODOO_URL = process.env.ODOO_URL;
const ODOO_DB = process.env.ODOO_DB;

if (!ODOO_URL || !ODOO_DB) {
    throw new Error('Odoo XML-RPC environment variables (ODOO_URL, ODOO_DB) are not set.');
}

// Helper to promisify the xmlrpc client calls
function callMethod(client: xmlrpc.Client, method: string, params: any[]): Promise<any> {
    return new Promise((resolve, reject) => {
        client.methodCall(method, params, (error, value) => {
            if (error) {
                console.error(`XML-RPC Error calling ${method}:`, error);
                // Try to extract a more specific error message from the fault object
                if (error.faultString) {
                    return reject(new Error(error.faultString));
                }
                return reject(error);
            }
            resolve(value);
        });
    });
}

export class OdooClient {
    private url: string;
    private db: string;
    private uid?: number;
    private password?: string;
    private commonClient: xmlrpc.Client;
    private objectClient: xmlrpc.Client;

    constructor(uid?: number, password?: string) {
        this.url = ODOO_URL!;
        this.db = ODOO_DB!;
        this.uid = uid;
        this.password = password;

        const urlParts = new URL(this.url);
        const clientOptions = {
            host: urlParts.hostname,
            port: parseInt(urlParts.port, 10) || (urlParts.protocol === 'https:' ? 443 : 80),
            path: urlParts.pathname,
            protocol: urlParts.protocol,
        };

        this.commonClient = xmlrpc.createClient({ ...clientOptions, path: '/xmlrpc/2/common' });
        this.objectClient = xmlrpc.createClient({ ...clientOptions, path: '/xmlrpc/2/object' });
    }

    async authenticate(login: string, password_user: string): Promise<number | false> {
        try {
            const uid = await callMethod(this.commonClient, 'authenticate', [
                this.db,
                login,
                password_user,
                {},
            ]);
            if (uid) {
                this.uid = uid;
                this.password = password_user;
                return uid;
            }
            return false;
        } catch (error) {
            console.error("Authentication failed:", error);
            return false;
        }
    }
    
    async executeKw<T>(model: string, method: string, args: any[] = [], kwargs: any = {}): Promise<T> {
        if (!this.uid || !this.password) {
            throw new Error('User is not authenticated. Cannot execute method.');
        }
        const params = [this.db, this.uid, this.password, model, method, args, kwargs];
        return callMethod(this.objectClient, 'execute_kw', params) as Promise<T>;
    }
}

let odooClientInstance: OdooClient | null = null;

export function getOdooClient(uid?: number, password?: string) {
  if (!odooClientInstance) {
      odooClientInstance = new OdooClient(uid, password);
  }
  return odooClientInstance;
}
