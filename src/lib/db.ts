import postgres from 'postgres';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const connectionString = process.env.DATABASE_URL.replace('localhost', '127.0.0.1');

export const sql = postgres(connectionString);

/**
 * Executes a SQL query and returns the result with a specific type.
 * @param queryString The SQL query string.
 * @param params Optional parameters for the query.
 * @returns A promise that resolves with the query result.
 */
export async function query<T>(queryString: string, params: any[] = []): Promise<T[]> {
  const result = await sql.unsafe(queryString, params);
  return result as T[];
}

export async function checkDbConnection(): Promise<boolean> {
  try {
    await sql`SELECT 1`;
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  }
}
