import { z } from 'zod';

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

export const WebhookHeadersSchema = z.object({
    'svix-id': z.string().min(1),
    'svix-timestamp': z.string().regex(/^\d+$/),
    'svix-signature': z.string().min(1)
});

export type WebhookHeaders = z.infer<typeof WebhookHeadersSchema>;
