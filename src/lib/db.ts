import { Pool, types } from 'pg';

// Ensure environment variables are loaded
if (!process.env.db_host) {
    console.error("Database environment variables are not set. Please check your .env file.");
    throw new Error('Database environment variables are not set.');
}

// Convert NUMERIC types from string to float to avoid calculation errors in JS
types.setTypeParser(types.builtins.NUMERIC, (value: string) => {
    return parseFloat(value);
});

const pool = new Pool({
  host: process.env.db_host,
  port: process.env.db_port ? parseInt(process.env.db_port, 10) : 5432,
  user: process.env.db_user,
  password: process.env.db_password,
  database: process.env.db_name,
});

pool.on('connect', () => {
    console.log('🔗 Connected to the database via connection pool');
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export const query = async <T>(text: string, params: any[] = []): Promise<T[]> => {
  try {
    const res = await pool.query(text, params);
    return res.rows;
  } catch (error) {
    console.error('Error executing query', { text, params, error });
    throw error;
  }
};

export async function checkDbConnection(): Promise<boolean> {
  let client;
  try {
    client = await pool.connect();
    // A successful connection is enough. No need to query.
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  } finally {
    if (client) {
      client.release();
    }
  }
}