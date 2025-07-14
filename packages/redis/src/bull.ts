import Redis from 'ioredis';

import { env } from './env';

export const createBullConnection = () =>
    new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: null,
        enableOfflineQueue: false
    });
