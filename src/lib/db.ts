import postgres from 'postgres';
import 'dotenv/config'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Replace localhost with 127.0.0.1 to avoid ECONNREFUSED errors on some systems
const connectionString = process.env.DATABASE_URL.replace('localhost', '127.0.0.1');

export const sql = postgres(connectionString);