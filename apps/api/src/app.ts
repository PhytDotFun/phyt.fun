import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { usersRouter } from './routes/users';
import { statusRouter } from './routes/status';

const app = new Hono();

app.use('*', logger());

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const apiRoutes = app
    .basePath('/api')
    .route('/users', usersRouter)
    .route('/status', statusRouter);

export default app;
export type ApiRouter = typeof apiRoutes;
