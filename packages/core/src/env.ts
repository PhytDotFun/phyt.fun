import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
    server: {
        NODE_ENV: z
            .enum(['development', 'production', 'test'])
            .default('development')
    },
    clientPrefix: 'VITE_',
    client: {
        VITE_PRIVY_CLIENT_ID: z.string(),
        VITE_PRIVY_APP_ID: z.string()
    },
    runtimeEnv: {
        NODE_ENV: process.env.NODE_ENV,

        VITE_PRIVY_CLIENT_ID: import.meta.env.VITE_PRIVY_CLIENT_ID,
        VITE_PRIVY_APP_ID: import.meta.env.VITE_PRIVY_APP_ID
    },
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
