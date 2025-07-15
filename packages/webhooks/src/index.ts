import crypto from 'crypto';

import { z } from 'zod';
import type { CacheAdapter } from '@phyt/redis/cache';
export interface WebhookConfig {
    secret: string;
    timestampTolerance?: number; // seconds – default five minutes
    ipAllowlist?: readonly string[];
}

export class WebhookVerifier {
    private readonly tolerance: number;
    private readonly ipSet?: ReadonlySet<string>;

    constructor(private readonly cfg: WebhookConfig) {
        this.tolerance = cfg.timestampTolerance ?? 300;
        this.ipSet = cfg.ipAllowlist
            ? new Set(cfg.ipAllowlist.map((ip) => ip.trim()))
            : undefined;
    }

    verify(
        payload: string,
        signature: string,
        timestamp: string,
        clientIp?: string
    ): { valid: true } | { valid: false; error: string } {
        if (this.ipSet && clientIp && !this.ipSet.has(clientIp)) {
            return { valid: false, error: 'IP not allowed' };
        }

        const ts = Number.parseInt(timestamp, 10);
        const now = Math.floor(Date.now() / 1_000);

        if (!Number.isFinite(ts)) {
            return { valid: false, error: 'Bad timestamp' };
        }
        if (Math.abs(now - ts) > this.tolerance) {
            return { valid: false, error: 'Timestamp too old' };
        }

        const expectedSig = this.sign(payload, timestamp);

        try {
            const ok = crypto.timingSafeEqual(
                Buffer.from(signature),
                Buffer.from(expectedSig)
            );
            return ok
                ? { valid: true }
                : { valid: false, error: 'Invalid signature' };
        } catch {
            return { valid: false, error: 'Signature format mismatch' };
        }
    }

    private sign(body: string, ts: string): string {
        return crypto
            .createHmac('sha256', this.cfg.secret)
            .update(`${ts}.${body}`)
            .digest('hex');
    }
}

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
        private readonly ttlSeconds: number = 86_400 // 24 h
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

export * from './privy';
