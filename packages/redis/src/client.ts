import Redis from 'ioredis';

import { env } from './env';

// Singleton instance to prevent multiple event handlers
let redisInstance: Redis | null = null;

export function getRedisClient(): Redis {
    if (redisInstance) {
        return redisInstance;
    }

    redisInstance = new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: 5,
        enableReadyCheck: true,
        lazyConnect: false,
        retryStrategy(times) {
            const delay = Math.min(times * 50, 2000);
            return delay;
        },
        reconnectOnError(err) {
            const targetError = 'READONLY';
            if (err.message.includes(targetError)) {
                // Only reconnect when the error contains "READONLY"
                return true;
            }
            return false;
        }
    });

    redisInstance.on('error', (error) => {
        console.error('[redis] Error:', error);
    });

    redisInstance.on('connect', () => {
        console.info('[redis] Connected');
    });

    redisInstance.on('reconnecting', () => {
        console.info('[redis] Reconnecting...');
    });

    redisInstance.on('ready', () => {
        console.info('[redis] Ready to accept commands');
    });

    redisInstance.on('close', () => {
        console.info('[redis] Connection closed');
    });

    // Graceful shutdown handler
    const gracefulShutdown = async (signal: string): Promise<void> => {
        console.info(`[redis] Received ${signal}, shutting down gracefully...`);
        try {
            if (redisInstance) {
                await redisInstance.quit();
                redisInstance = null;
                console.info('[redis] Disconnected gracefully');
            }
            process.exit(0);
        } catch (error) {
            console.error('[redis] Error during shutdown:', error);
            process.exit(1);
        }
    };

    // Handle process termination signals
    process.once('SIGINT', () => {
        void gracefulShutdown('SIGINT');
    });

    process.once('SIGTERM', () => {
        void gracefulShutdown('SIGTERM');
    });

    return redisInstance;
}

export const redis = getRedisClient();
