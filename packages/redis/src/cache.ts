import { z } from 'zod';
import type Redis from 'ioredis';
import type { Cache } from '@phyt/core/contracts';

export function createCache(redis: Redis): Cache {
    return new (class implements Cache {
        async get<T>(key: string, schema?: z.ZodSchema<T>): Promise<T | null> {
            try {
                const value = await redis.get(key);
                if (!value) {
                    return null;
                }
                const parsed: unknown = JSON.parse(value);
                if (schema) {
                    const result = schema.safeParse(parsed);
                    if (!result.success) {
                        console.error(
                            `[CACHE] Invalid data for key ${key}:`,
                            result.error
                        );
                        await this.delete(key);
                        return null;
                    }
                    return result.data;
                }
                return parsed as T;
            } catch (error) {
                console.error(`[CACHE] Invalid data for key ${key}:`, error);
                return null;
            }
        }

        async set(
            key: string,
            value: unknown,
            ttlSeconds?: number
        ): Promise<void> {
            try {
                const serialized = JSON.stringify(value);
                if (ttlSeconds && ttlSeconds > 0) {
                    await redis.set(key, serialized, 'EX', ttlSeconds);
                } else {
                    await redis.set(key, serialized);
                }
            } catch (error) {
                console.error(`[CACHE] Error setting key ${key}:`, error);
                throw error;
            }
        }

        async delete(key: string): Promise<void> {
            try {
                await redis.del(key);
            } catch (error) {
                console.error(`[CACHE] Error deleting key ${key}:`, error);
                throw error;
            }
        }

        async invalidate(pattern: string): Promise<number> {
            return new Promise((resolve, reject) => {
                const stream = redis.scanStream({
                    match: pattern,
                    count: 100
                });

                const pipeline = redis.pipeline();
                let count = 0;

                stream.on('data', (keys: string[]) => {
                    if (keys.length) {
                        keys.forEach((key) => pipeline.del(key));
                        count += keys.length;
                    }
                });

                stream.on('end', () => {
                    if (count > 0) {
                        pipeline
                            .exec()
                            .then(() => {
                                console.info(
                                    `[CACHE] Invalidated ${count.toString()}. Keys matching ${pattern}`
                                );
                                resolve(count);
                            })
                            .catch((error: unknown) => {
                                console.error(
                                    '[CACHE] Error executing pipeline:',
                                    error
                                );
                                reject(
                                    error instanceof Error
                                        ? error
                                        : new Error(String(error))
                                );
                            });
                    } else {
                        resolve(0);
                    }
                });

                stream.on('error', (err) => {
                    console.error('[CACHE] Error during invalidation:', err);
                    reject(err);
                });
            });
        }

        // Cache-aside pattern helper
        async getOrSet<T>(
            key: string,
            factory: () => Promise<T>,
            ttlSeconds?: number,
            schema?: z.ZodSchema<T>
        ): Promise<T> {
            const cached = await this.get(key, schema);
            if (cached !== null) {
                return cached;
            }

            const value = await factory();

            if (schema) {
                const result = schema.safeParse(value);
                if (!result.success) {
                    throw new Error(
                        `[CACHE] Value from facotry does not match schema: ${result.error.message}`
                    );
                }
            }
            await this.set(key, value, ttlSeconds);
            return value;
        }
    })();
}
