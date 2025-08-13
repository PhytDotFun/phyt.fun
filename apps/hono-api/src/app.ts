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
        allowHeaders: ['Content-Type', 'Authorization', 'privy-id-token'],
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        credentials: true
    })
);

// Health check endpoints
// Simple health check (used by load balancers)
app.get('/health', (c) => c.json({ status: 'ok' }));
app.get('/api/health', (c) => c.json({ status: 'ok' }));

// Comprehensive health check with dependencies
app.get('/api/health/detailed', async (c) => {
    const checks = {
        api: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: env.NODE_ENV,
        memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
        },
        database: 'unknown',
        redis: 'unknown'
    };

    // Check database health
    try {
        const { appDeps } = await import('./di');
        await appDeps.db.execute('SELECT 1');
        checks.database = 'ok';
    } catch (error) {
        checks.database = 'error';
        console.error('Database health check failed:', error);
    }

    // Check Redis health
    try {
        const { appDeps } = await import('./di');
        await appDeps.redis.ping();
        checks.redis = 'ok';
    } catch (error) {
        checks.redis = 'error';
        console.error('Redis health check failed:', error);
    }

    return c.json(checks);
});

app.route(env.PRIVY_WEBHOOK_ENDPOINT, privyWebhook);

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
