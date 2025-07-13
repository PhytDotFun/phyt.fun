import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';
import 'dotenv/config';

export const env = createEnv({
    server: {
        NODE_ENV: z
            .enum(['development', 'production', 'test'])
            .default('development'),
        CORS_ORIGIN: z.string(),
        PORT: z.coerce.number(),
        PRIVY_APP_ID: z.string(),
        PRIVY_SECRET_KEY: z.string(),
        PRIVY_VERIFICATION_KEY: z.string(),
        PRIVY_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
        WEBHOOK_ENDPOINT: z.string(),
        DATABASE_URL: z.string().url()
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
