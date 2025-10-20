import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';
import * as dotenv from 'dotenv';

dotenv.config({ path: process.env.ENV_PATH || '.env', override: true });

export const env = createEnv({
    server: {
        NODE_ENV: z.enum(['development', 'production', 'test', 'staging']).default('development'),
        LOG_LEVEL: z
            .enum(['trace', 'debug', 'info', 'warn', 'error'])
            .default('info'),
        PRIVY_APP_ID: z.string().min(1),
        PRIVY_SECRET_KEY: z.string().min(1),
        DATABASE_URL: z.url(),
        REDIS_URL: z.url(),
        WORKER_CONCURRENCY: z.coerce.number().min(1).default(5),
        WORKER_RATE_LIMIT: z.coerce.number().min(1).default(10),
        CRON_SCHEDULE: z.string().default('*/5 * * * *'),
        POSTS_SALT: z.string(),
        COMMENTS_SALT: z.string(),
        REACTIONS_SALT: z.string(),
        RUNS_SALT: z.string(),
        USERS_SALT: z.string()
    },
    runtimeEnv: process.env,
    emptyStringAsUndefined: true,
    onValidationError: (error) => {
        console.error('Invalid environment variables:', error);
        throw new Error('Invalid environment variables');
    },
    onInvalidAccess: (variable) => {
        console.error(
            `Attempted to access invalid environment variable: ${variable}`
        );
        throw new Error(`Invalid environment variable: ${variable}`);
    }
});
