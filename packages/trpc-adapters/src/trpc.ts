import { initTRPC, TRPCError } from '@trpc/server';
import type { AuthTokenClaims } from '@privy-io/server-auth';
import superjson from 'superjson';

import type { AppDependencies } from './di';

export interface AppContext extends Record<string, unknown>, AppDependencies {
    authClaims: AuthTokenClaims | null;
    userId?: string;
}

const t = initTRPC.context<AppContext>().create({
    transformer: superjson
});

export const router = t.router;
export const publicProcedure = t.procedure;

const isAuthenticated = t.middleware(async ({ ctx, next }) => {
    if (!ctx.authClaims) throw new TRPCError({ code: 'UNAUTHORIZED' });
    return next({
        ctx: { ...ctx, userId: ctx.authClaims.userId }
    });
});
export const protectedProcedure: ReturnType<typeof t.procedure.use> =
    t.procedure.use(isAuthenticated);
