/**
 * Lightweight API router for Privy webhooks.
 * Business logic is handled by the webhooks package.
 */
import { Hono } from 'hono';
import { webhookResponse, PrivyWebhookHandler } from '@phyt/webhooks';
import { queueFactory } from '@phyt/m-queue/queue';

import { dependencies } from '@/di';
import { env } from '@/env';

// Create webhook handler
const privyWebhookHandler = new PrivyWebhookHandler({
    privyClient: dependencies.privy,
    secret: env.PRIVY_WEBHOOK_SECRET,
    queueFactory
});

export const privyWebhook = new Hono().post('/', async (c) => {
    try {
        // Get raw body
        const rawBody = await c.req.text();

        // Extract headers
        const headers = {
            id: c.req.header('svix-id') || '',
            timestamp: c.req.header('svix-timestamp') || '',
            signature: c.req.header('svix-signature') || '',
            clientIp:
                c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
                c.req.header('x-real-ip') ||
                'unknown'
        };

        // Delegate to webhook handler
        const result = await privyWebhookHandler.handle(rawBody, headers);

        return new Response(JSON.stringify(result.body), {
            status: result.status,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Webhook processing error:', error);
        const errorResponse = webhookResponse.error(
            'Internal server error',
            500
        );
        return new Response(JSON.stringify(errorResponse.body), {
            status: errorResponse.status,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});
