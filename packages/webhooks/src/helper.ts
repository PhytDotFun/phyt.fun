import { z } from 'zod';
import type { CacheAdapter } from '@phyt/redis/cache';

interface ResponseBodyBase {
    ok: boolean;
    message?: string;
    error?: string;
    jobId?: string | number;
}

export interface WebhookResponse<T extends object = Record<string, never>> {
    status: number;
    body: ResponseBodyBase & T;
}

export const webhookResponse = {
    success: <T extends object = Record<string, never>>(
        data?: T
    ): WebhookResponse<T> => ({
        status: 200,
        body: { ok: true, ...(data ?? {}) } as ResponseBodyBase & T
    }),

    accepted: (
        jobId?: string | number
    ): WebhookResponse<{ jobId?: string | number }> => ({
        status: 202,
        body: {
            ok: true,
            message: 'Accepted for processing',
            ...(jobId ? { jobId } : {})
        }
    }),

    error: (msg: string, status = 400): WebhookResponse<{ error: string }> => ({
        status,
        body: { ok: false, error: msg }
    }),

    duplicate: (): WebhookResponse<{ message: string }> => ({
        status: 200,
        body: { ok: true, message: 'Event already processed' }
    })
};

export class IdempotencyManager {
    constructor(
        private readonly cache: CacheAdapter,
        private readonly ttlSeconds: number = 86_400
    ) {
        if (ttlSeconds <= 0) throw new Error('TTL must be positive');
    }

    private makeKey(id: string, event: string): string {
        return `webhook:${id}:${event}`;
    }

    async checkAndMark(
        id: string,
        event: string,
        data?: unknown
    ): Promise<{ isDuplicate: boolean; key: string }> {
        const key = this.makeKey(id, event);
        const already = await this.cache.get<boolean>(key);

        if (!already) {
            await this.cache.set(key, data ?? true, this.ttlSeconds);
        }
        return { isDuplicate: Boolean(already), key };
    }

    delete(key: string): Promise<void> {
        return this.cache.delete(key);
    }
}

export const WebhookHeadersSchema = z.object({
    'svix-id': z.string().min(1),
    'svix-timestamp': z.string().regex(/^\d+$/),
    'svix-signature': z.string().min(1)
});

export type WebhookHeaders = z.infer<typeof WebhookHeadersSchema>;
