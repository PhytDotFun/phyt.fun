import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';
import 'dotenv/config';

export const env = createEnv({
    server: {
        NODE_ENV: z
            .enum(['development', 'production', 'test'])
            .default('development'),
        PORT: z.number().default(3000),
        PRIVY_APP_ID: z.string(),
        PRIVY_SECRET_KEY: z.string(),
        PRIVY_VERIFICATION_KEY: z.string()
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
