import { serve } from '@hono/node-server';
import app from './app';
import { env } from './env';
export type { ApiRouter } from './app';
serve(
    {
        fetch: app.fetch.bind(app),
        port: env.PORT
    },
    (info) => {
        console.log(`Server is running on http://localhost:${info.port}`);
    }
);
