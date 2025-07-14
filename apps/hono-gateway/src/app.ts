import { Hono } from 'hono';
import { trpcServer } from '@hono/trpc-server';

import { apiRouter } from './router';
import { privyWebhook } from './webhooks/privy-webhook';
import { authMiddleware } from './middleware/auth';
import type { HonoEnv } from './middleware/auth';
import { createContext } from './context';
import { env } from './env';

export const app = new Hono<HonoEnv>();

app.use('*', authMiddleware);

app.route(env.WEBHOOK_ENDPOINT, privyWebhook);

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
