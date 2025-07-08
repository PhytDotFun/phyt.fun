import { Hono } from 'hono';

export const statusRouter = new Hono().get('/', (c) => {
    try {
        // Add any health checks here (database, external services, etc.)
        // For now, just return success
        return c.json(
            {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime()
            },
            200
        );
    } catch (error) {
        return c.json(
            {
                status: 'unhealthy',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            },
            500
        );
    }
});
