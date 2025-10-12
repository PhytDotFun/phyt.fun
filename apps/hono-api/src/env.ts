import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';
import * as dotenv from 'dotenv';

dotenv.config({ path: process.env.ENV_PATH || '.env', override: true });

export const env = createEnv({
    server: {
        NODE_ENV: z.enum(['dev', 'prod', 'test', 'staging']).default('dev'),
        CORS_ORIGIN: z.string(),
        LOG_LEVEL: z
            .enum(['trace', 'debug', 'info', 'warn', 'error'])
            .default('info'),
        PORT: z.coerce.number(),
        PRIVY_APP_ID: z.string(),
        PRIVY_SECRET_KEY: z.string(),
        PRIVY_VERIFICATION_KEY: z.string(),
        PRIVY_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
        PRIVY_WEBHOOK_ENDPOINT: z.string(),
        REDIS_URL: z.url(),
        DATABASE_URL: z.url(),
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
