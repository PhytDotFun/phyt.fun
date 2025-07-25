import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

export function createPgClient(connectionString: string) {
    return new Pool({ connectionString });
}

export function createDb(connectionString: string) {
    return drizzle(connectionString);
}
