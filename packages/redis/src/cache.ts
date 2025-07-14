import { redis } from './client';

export const cache = {
    async get<T>(
        key: string,
        validator: (data: unknown) => data is T
    ): Promise<T | null> {
        const value = await redis.get(key);
        if (!value) {
            return null;
        }

        let parsed: unknown;
        try {
            parsed = JSON.parse(value);
        } catch {
            await this.delete(key);
            return null;
        }

        if (validator(parsed)) {
            return parsed;
        }

        await this.delete(key);
        return null;
    },

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
    async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
        const serialized = JSON.stringify(value);
        if (ttlSeconds) {
            await redis.set(key, serialized, 'EX', ttlSeconds);
        } else {
            await redis.set(key, serialized);
        }
    },

    async delete(key: string): Promise<void> {
        await redis.del(key);
    },

    async invalidate(pattern: string): Promise<void> {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
            await redis.del(...keys);
        }
    }
};
