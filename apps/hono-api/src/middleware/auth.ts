import type { MiddlewareHandler } from 'hono';
import type { AuthTokenClaims } from '@privy-io/server-auth';

import { env } from '../env';
import { appDeps } from '../di';

export type HonoEnv = {
    Variables: {
        authClaims: AuthTokenClaims;
        identityToken?: string;
    };
};

export const authMiddleware: MiddlewareHandler<HonoEnv> = async (c, next) => {
    const verificationKey = Buffer.from(
        env.PRIVY_VERIFICATION_KEY,
        'base64'
    ).toString('utf-8');

    const authToken = c.req.header('Authorization')?.replace('Bearer ', '');
    const idToken = c.req.header('privy-id-token');

    if (authToken) {
        try {
            const claims = await appDeps.privy.verifyAuthToken(
                authToken,
                verificationKey
            );
            c.set('authClaims', claims);

            if (idToken) {
                c.set('identityToken', idToken);
            } else {
                console.log('[AUTH] No identity token provided');
            }
        } catch (error) {
            console.log('[AUTH] Auth failed:', error);
            /* ignore unauthenticated */
        }
    } else {
        console.log('[Auth] No auth token provided');
    }
    await next();
};
