import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

import { env } from '@/env';

export const pgClient = new Pool({ connectionString: env.DATABASE_URL });
export const db = drizzle(env.DATABASE_URL);
