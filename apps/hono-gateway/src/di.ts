import type { Dependencies as Deps } from '@phyt/core/di';
import { db } from '@phyt/data-persistence/db/client';
// import Redis from 'ioredis';

export const dependencies: Deps = {
    db
    // redis: new Redis(env.REDIS_URL),
    // log
};
