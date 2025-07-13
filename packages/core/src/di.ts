import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
// import type { Redis } from 'ioredis';
// import type { Logger } from 'pino';

export interface Dependencies {
    db: NodePgDatabase;
    // redis: Redis;
    // log: Logger;
}
