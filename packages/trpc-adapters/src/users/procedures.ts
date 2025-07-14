import { TRPCError } from '@trpc/server';
import { UserProfileSchema } from '@phyt/data-access/models/users';

import { router, protectedProcedure } from '@/trpc';

import { UserService } from './service';

export const userRouter = router({
    me: protectedProcedure.query(async ({ ctx }) => {
        const svc = new UserService(ctx);
        const user = await svc.me(ctx.userId);
        if (!user)
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Error fetching user'
            });
        return UserProfileSchema.parse(user);
    })
});
