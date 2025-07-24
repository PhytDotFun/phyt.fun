import type { z } from 'zod';
import type { Queue, JobsOptions } from 'bullmq';

export interface Cache {
    get<T>(key: string, schema?: z.ZodSchema<T>): Promise<T | null>;
    set(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
    delete(key: string): Promise<void>;
    invalidate(pattern: string): Promise<number>;
    getOrSet<T>(
        key: string,
        factory: () => Promise<T>,
        ttlSeconds?: number,
        schema?: z.ZodSchema<T>
    ): Promise<T>;
}

export interface Idempotency {
    checkAndMark(
        id: string,
        event: string,
        data?: unknown
    ): Promise<{ isDuplicate: boolean; key: string }>;
    delete(key: string): Promise<void>;
}

export interface QueueWithContext extends Queue {
    addJobWithContext(
        name: string,
        data: unknown,
        opts?: JobsOptions
    ): Promise<string | number>;
}

export interface IdEncoder {
    encode(entityType: string, id: number): string;
    decode(entityType: string, encodedId: string): number | null;
    encodedMany(entityType: string, ids: number[]): string[];
    decodeMany(entityType: string, encodedIds: string[]): number[];
    isValidEncodedId(entityType: string, encodedId: string): boolean;
    createValidationSchema(entityType: string): z.ZodSchema<string>;
}
