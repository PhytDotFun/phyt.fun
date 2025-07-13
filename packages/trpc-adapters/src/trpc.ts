import { initTRPC, TRPCError } from '@trpc/server';
import type { Dependencies as Deps } from '@phyt/core/di';
import type { AuthTokenClaims } from '@privy-io/server-auth';
import superjson from 'superjson';

export interface AppContext extends Record<string, unknown>, Deps {
    authClaims: AuthTokenClaims | null;
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
export const protectedProcedure = t.procedure.use(isAuthenticated);
