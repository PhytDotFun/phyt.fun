import type { MiddlewareHandler } from 'hono';
import type { AuthTokenClaims } from '@privy-io/server-auth';

import privy from '@/privy';
import { env } from '@/env';

export type HonoEnv = {
    Variables: { authClaims: AuthTokenClaims };
};

export const authMiddleware: MiddlewareHandler<HonoEnv> = async (c, next) => {
    const authToken = c.req.header('Authorization')?.replace('Bearer ', '');
    if (authToken) {
        try {
            c.set(
                'authClaims',
                await privy.verifyAuthToken(
                    authToken,
                    env.PRIVY_VERIFICATION_KEY
                )
            );
        } catch {
            /* ignore unauthenticated */
        }
    }
    await next();
};
