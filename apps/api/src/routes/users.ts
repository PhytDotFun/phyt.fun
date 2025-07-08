import { Hono } from 'hono';
import { privyAuthMiddleware, privyUserMiddleware } from '../middleware/auth';
import { privy } from '../privy';

export const usersRouter = new Hono()
    .get('/', privyAuthMiddleware, async (c) => {
        // const { page, limit } = c.req.query();
        return c.json({
            message: 'Hello Users!'
            // data: {
            //     page,
            //     limit
            // }
        });
    })
    .get('/:id', privyAuthMiddleware, async (c) => {
        const { id } = c.req.param();
        return c.json({
            message: `Hello!`,
            data: { id }
        });
    })
    .get('/me', privyAuthMiddleware, privyUserMiddleware, async (c) => {
        const privyUser = c.get('privyUser');
        return c.json({
            message: `Hello, ${privyUser.twitter?.name}`,
            data: { privyUser }
        });
    })
    .post('/create', privyAuthMiddleware, privyUserMiddleware, async (c) => {
        const privyUser = c.get('privyUser');

        if (
            privyUser.customMetadata.onboarded &&
            privyUser.customMetadata.onboard === true
        ) {
            return c.json({ message: 'Forbidden' }, 403);
        }

        // Db insert

        privy.setCustomMetadata(privyUser.id, { onboarded: true });
    });
