import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
    clientPrefix: 'VITE_',
    client: {
        VITE_NODE_ENV: z
            .enum(['development', 'production', 'test'])
            .default('development'),
        VITE_PRIVY_CLIENT_ID: z.string(),
        VITE_PRIVY_APP_ID: z.string(),
        VITE_BASE_URL: z.url()
    },
    runtimeEnv: {
        VITE_NODE_ENV: import.meta.env.VITE_NODE_ENV,
        VITE_PRIVY_CLIENT_ID: import.meta.env.VITE_PRIVY_CLIENT_ID,
        VITE_PRIVY_APP_ID: import.meta.env.VITE_PRIVY_APP_ID,
        VITE_BASE_URL: import.meta.env.VITE_BASE_URL
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
