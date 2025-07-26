import { TRPCError } from '@trpc/server';
import { UserSchema } from '@phyt/data-access/models/users';
import { z } from 'zod';

import { router, protectedProcedure } from '../trpc';

export const usersRouter = router({
    getCurrentUser: protectedProcedure.query(async ({ ctx }) => {
        if (!ctx.userId) {
            throw new TRPCError({
                code: 'UNAUTHORIZED',
                message: 'User ID not found in context'
            });
        }

        const currentUser = await ctx.usersService.getUserByPrivyDID(
            ctx.userId
        );

        if (!currentUser) {
            // User exists in auth context but not in database
            // Trigger automatic sync if we have an identity token
            if (ctx.identityToken) {
                console.log(
                    `[TRPC] User ${ctx.userId} missing from database, triggering sync with identity token`
                );

                try {
                    await ctx.usersService.triggerUserSyncWithIdentityToken(
                        ctx.identityToken
                    );

                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message: 'User sync in progress'
                    });
                } catch (syncError) {
                    // Check if this is the intentional "User sync in progress" error
                    if (
                        syncError instanceof TRPCError &&
                        syncError.message === 'User sync in progress'
                    ) {
                        // Re-throw the intentional sync error
                        throw syncError;
                    }

                    console.error(
                        `[TRPC] Failed to trigger user sync:`,
                        syncError
                    );
                    // Fall through to original error only for actual sync failures
                }
            }

            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Error fetching user'
            });
        }

        return UserSchema.parse(currentUser);
    }),
    getUserByPrivyDID: protectedProcedure
        .input(z.string().startsWith('did:privy:'))
        .query(async ({ ctx, input }) => {
            const privyDID = input;

            if (!ctx.userId) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'User ID not found in context'
                });
            }
            const user = await ctx.usersService.getUserByPrivyDID(privyDID);
            if (!user) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Error fetching user'
                });
            }
            return UserSchema.parse(user);
        }),
    getUserByWalletAddress: protectedProcedure
        .input(z.string())
        .query(async ({ ctx, input }) => {
            const walletAddress = input;

            if (!ctx.userId) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'User ID not found in context'
                });
            }
            const user =
                await ctx.usersService.getUserByWalletAddress(walletAddress);
            if (!user) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'User not found'
                });
            }
            return UserSchema.parse(user);
        })
});
