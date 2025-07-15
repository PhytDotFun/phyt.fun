import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { PrivyClient } from '@privy-io/server-auth';
import type Redis from 'ioredis';

export interface Dependencies {
    db: NodePgDatabase;
    redis: Redis;
    privy: PrivyClient;
}
