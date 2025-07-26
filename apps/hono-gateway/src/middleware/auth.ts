import type { MiddlewareHandler } from 'hono';
import type { AuthTokenClaims } from '@privy-io/server-auth';

import { env } from '../env';
import { appDeps } from '../di';

export type HonoEnv = {
    Variables: { authClaims: AuthTokenClaims };
};

export const authMiddleware: MiddlewareHandler<HonoEnv> = async (c, next) => {
    const verificationKey = Buffer.from(
        env.PRIVY_VERIFICATION_KEY,
        'base64'
    ).toString('utf-8');

    const authToken = c.req.header('Authorization')?.replace('Bearer ', '');
    if (authToken) {
        try {
            console.log('[auth] Verifying token with Privy');
            const claims = await appDeps.privy.verifyAuthToken(
                authToken,
                verificationKey
            );
            c.set('authClaims', claims);
            console.log('[auth] Auth successful for user:', claims.userId);
        } catch (error) {
            console.log('[auth] Auth failed:', error);
            /* ignore unauthenticated */
        }
    } else {
        console.log('[auth] No auth token provided');
    }
    await next();
};
