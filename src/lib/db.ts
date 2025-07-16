
import postgres from 'postgres';
import dotenv from 'dotenv';

// Explicitly load environment variables from .env file
dotenv.config();

const { db_host, db_port, db_name, db_user, db_password } = process.env;

if (!db_host || !db_port || !db_name || !db_user || !db_password) {
  throw new Error('Database connection environment variables are not set. Please check your .env file.');
}

const connectionString = `postgres://${db_user}:${db_password}@${db_host}:${db_port}/${db_name}`;

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
    // Use a simple query that doesn't depend on any specific table
    await sql`SELECT 1`;
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  }
}
