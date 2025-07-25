import Redis from 'ioredis';

// BullMQ requires separate connections with specific settings
export const createBullConnection = (url: string): Redis =>
    new Redis(url, {
        maxRetriesPerRequest: null,
        enableOfflineQueue: false
    });
