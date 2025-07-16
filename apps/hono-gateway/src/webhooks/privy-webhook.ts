import { Hono } from 'hono';
import { PrivyWebhookHandler, webhookResponse } from '@phyt/webhooks';
import { queueFactory } from '@phyt/m-queue/queue';

import { dependencies } from '../di';
import { env } from '../env';

const privyWebhookHandler = new PrivyWebhookHandler({
    privyClient: dependencies.privy,
    secret: env.PRIVY_WEBHOOK_SECRET,
    queueFactory
});

export const privyWebhook = new Hono().post('/', async (c) => {
    try {
        // Use arrayBuffer() to get the raw bytes, then convert to string
        // This preserves the exact body that Privy signed
        const arrayBuffer = await c.req.arrayBuffer();
        const rawBody = new TextDecoder().decode(arrayBuffer);

        // Check for required headers
        const svixId = c.req.header('svix-id');
        const svixTimestamp = c.req.header('svix-timestamp');
        const svixSignature = c.req.header('svix-signature');

        if (!svixId || !svixTimestamp || !svixSignature) {
            console.error('[Webhook] Missing required svix headers');
            const errorResponse = webhookResponse.error(
                'Missing required webhook headers',
                400
            );
            return new Response(JSON.stringify(errorResponse.body), {
                status: errorResponse.status,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const headers = {
            id: svixId,
            timestamp: svixTimestamp,
            signature: svixSignature,
            clientIp:
                c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
                c.req.header('x-real-ip') ||
                'unknown'
        };

        const result = await privyWebhookHandler.handle(rawBody, headers);

        return new Response(JSON.stringify(result.body), {
            status: result.status,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('[Webhook] Processing error:', error);
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
