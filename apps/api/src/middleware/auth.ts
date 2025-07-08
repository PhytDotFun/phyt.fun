import type { User as PrivyUser } from '@privy-io/server-auth';
import { createMiddleware } from 'hono/factory';
import { getCookie } from 'hono/cookie';
import { privy } from '../privy';
import { env } from '../env';

type AuthContext = {
    Variables: {
        privyDID: string;
        privyUser: PrivyUser;
    };
};

export const privyAuthMiddleware = createMiddleware<AuthContext>(
    async (c, next) => {
        const privyCookie = getCookie(c, 'privy-token');
        if (!privyCookie) {
            return c.json({ message: 'Unauthorized' }, 401);
        }
        try {
            const claims = await privy.verifyAuthToken(
                privyCookie,
                env.PRIVY_VERIFICATION_KEY
            );
            const privyDID = claims.userId;

            c.set('privyDID', privyDID);
            await next();
        } catch (error) {
            console.error(error);
            return c.json({ message: 'Unauthorized' }, 401);
        }
    }
);

export const privyUserMiddleware = createMiddleware<AuthContext>(
    async (c, next) => {
        const privyDID = c.get('privyDID');
        if (!privyDID) {
            return c.json({ message: 'Unauthorized' }, 401);
        }

        const privyIdToken = getCookie(c, 'privy-id-token');
        if (!privyIdToken) {
            return c.json({ message: 'Unauthorized' }, 401);
        }

        const privyUser = await privy.getUser({ idToken: privyDID });

        c.set('privyUser', privyUser);
        await next();
    }
);
