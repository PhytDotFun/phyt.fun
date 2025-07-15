import Redis from 'ioredis';

import { env } from './env';

// BullMQ requires separate connections with specific settings
export const createBullConnection = (): Redis =>
    new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: null,
        enableOfflineQueue: false
    });

// Export the connection for BullMQ usage
export const redisBull = createBullConnection();
