import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { PrivyClient } from '@privy-io/server-auth';
import type Redis from 'ioredis';

import type {
    Cache,
    Idempotency,
    QueueWithContext,
    IdEncoder
} from './contracts';

export interface Dependencies {
    db: NodePgDatabase;
    redis: Redis;
    bull: Redis;
    cache: Cache;
    idempotency: Idempotency;
    privy: PrivyClient;
    authQueue: QueueWithContext;
    postsQueue: QueueWithContext;
    idEncoder: IdEncoder;
    salts: {
        users: string;
        posts: string;
        comments: string;
        reactions: string;
        runs: string;
    };
}
