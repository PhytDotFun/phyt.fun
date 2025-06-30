import { drizzle } from 'drizzle-orm/node-postgres';
import { env } from '@phyt/core';

export const db = drizzle(env.DATABASE_URL);
