import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from './env';
import * as schema from '../db/schema';

// Create a pg pool
const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

// Create the Drizzle instance
export const db = drizzle(pool, { schema });
