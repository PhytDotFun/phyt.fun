//
// Might explore breaking webhooks into own package
// (Just dependent how many more webhooks needed in the future)
//
// apps/api should serve as a lightweight interface to core logic that's defined in contextful packages
//
import { Hono } from 'hono';
import { InsertUserSchema } from '@phyt/data-persistence/db/models/users';
import { UserService } from '@phyt/trpc-adapters/users/service';

import privy from '@/privy';
import { env } from '@/env';
import { dependencies } from '@/di';

import type { PrivyWebhookEvent } from './webhook-types';

export const privyWebhook = new Hono().post('/', async (c) => {
    const id = c.req.header('svix-id') ?? '';
    const timestamp = c.req.header('svix-timestamp') ?? '';
    const signature = c.req.header('svix-signature') ?? '';
    const rawBody = await c.req.text();

    const ev = (await privy.verifyWebhook(
        rawBody,
        { id, timestamp, signature },
        env.PRIVY_WEBHOOK_SECRET
    )) as PrivyWebhookEvent;

    if (ev.type !== 'user.created' && ev.type !== 'user.authenticated') return;

    const user = ev.user;

    const walletAddress =
        user.wallet?.address ??
        (
            await privy.walletApi.createWallet({
                chainType: 'ethereum',
                owner: { userId: user.id }
            })
        ).address;

    const record = {
        privyUserId: user.id,
        username: user.twitter?.username ?? `user_${user.id.slice(0, 6)}`,
        profilePictureUrl: user.twitter?.profilePictureUrl ?? '',
        walletAddress: walletAddress,
        email: user.email?.address ?? null,
        role: 'user' as const
    };

    const newUser = InsertUserSchema.parse(record);
    await new UserService(dependencies).syncPrivyData(newUser);

    return c.json({ ok: true });
});
