import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { trpcServer } from '@hono/trpc-server';

import { apiRouter } from './router';
import { privyWebhook } from './webhooks/privy-webhook';
import { authMiddleware } from './middleware/auth';
import type { HonoEnv } from './middleware/auth';
import { createContext } from './context';
import { env } from './env';

export const app = new Hono<HonoEnv>();

// Add CORS middleware before other middleware
app.use(
    '*',
    cors({
        origin: env.CORS_ORIGIN,
        allowHeaders: ['Content-Type', 'Authorization'],
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        credentials: true
    })
);

app.get('/api/health', (c) => c.json({ status: 'ok' }));

app.route(env.WEBHOOK_ENDPOINT, privyWebhook);

app.use('*', authMiddleware);

app.use(
    '/trpc/*',
    trpcServer({
        router: apiRouter,
        createContext: createContext,
        onError({ error, type, path }) {
            console.error('tRPC Error:', { error, type, path });
        }
    })
);
