import postgres from 'postgres';
import 'dotenv/config'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

export const sql = postgres(process.env.DATABASE_URL);
