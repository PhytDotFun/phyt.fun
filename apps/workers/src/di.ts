import type { Dependencies } from '@phyt/core/di';
import { createDb } from '@phyt/data-access/db/client';
import { getRedisClient } from '@phyt/redis/client';
import { createCache } from '@phyt/redis/cache';
import { createBullConnection } from '@phyt/redis/bull';
import { PrivyClient } from '@privy-io/server-auth';
import { createAppDependencies } from '@phyt/trpc-adapters/di';
import { IdempotencyManager } from '@phyt/webhooks/idempotency';
import { createQueueRegistry } from '@phyt/m-queue/queue';
import { createIdEncoder } from '@phyt/trpc-adapters/encoder';

import { env } from './env';

const privy = new PrivyClient(env.PRIVY_APP_ID, env.PRIVY_SECRET_KEY);

const db = createDb(env.DATABASE_URL);
const redis = getRedisClient({ url: env.REDIS_URL });
const bull = createBullConnection(env.REDIS_URL);
const cache = createCache(redis);
const idempotency = new IdempotencyManager(cache);

const queues = createQueueRegistry(bull);
const authQueue = queues.createQueue('auth');
const postsQueue = queues.createQueue('posts');

const salts = {
    users: env.USERS_SALT,
    posts: env.POSTS_SALT,
    comments: env.COMMENTS_SALT,
    reactions: env.REACTIONS_SALT,
    runs: env.RUNS_SALT
};

const idEncoder = createIdEncoder(salts);

const coreDeps: Dependencies = {
    db,
    redis,
    bull,
    cache,
    idempotency,
    authQueue,
    postsQueue,
    privy,
    salts,
    idEncoder
};

export const appDeps = createAppDependencies(coreDeps);
