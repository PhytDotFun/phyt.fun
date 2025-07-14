import Redis from 'ioredis';

import { env } from './env';

export const redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 5,
    enableReadyCheck: true,
    lazyConnect: false
});

redis.on('error', (error) => {
    console.error('[redis] ', error);
});

redis.on('connect', () => {
    console.info('[redis] connected');
});

process.on('SIGINT', () => {
    void redis.quit();
});
