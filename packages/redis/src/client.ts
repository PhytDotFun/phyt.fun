import Redis, { RedisOptions } from 'ioredis';

export interface RedisConfig {
    url: string;
    options?: RedisOptions;
}
// Singleton instance to prevent multiple event handlers
let redisInstance: Redis | null = null;

export function getRedisClient(cfg: RedisConfig): Redis {
    if (redisInstance) {
        return redisInstance;
    }

    redisInstance = new Redis(cfg.url, {
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

    redisInstance
        .on('error', (e) => {
            console.error('[REDIS] Error:', e);
        })
        .on('connect', () => {
            console.info('[REDIS] Connected');
        })
        .on('reconnecting', () => {
            console.info('[REDIS] Reconnecting…');
        })
        .on('ready', () => {
            console.info('[REDIS] Ready');
        })
        .on('close', () => {
            console.info('[REDIS] Closed');
        });

    const shutdown = async (sig: string) => {
        console.info(`[REDIS] ${sig} received, quitting…`);
        try {
            await redisInstance?.quit();
            redisInstance = null;
            console.info('[REDIS] Quit cleanly');
        } finally {
            process.exit(0);
        }
    };
    process.once('SIGINT', () => void shutdown('SIGINT'));
    process.once('SIGTERM', () => void shutdown('SIGTERM'));

    return redisInstance;
}
