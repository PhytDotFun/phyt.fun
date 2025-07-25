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
        const currentUser = await ctx.userService.getUserByPrivyDID(ctx.userId);
        if (!currentUser) {
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
            const user = await ctx.userService.getUserByPrivyDID(privyDID);
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
                await ctx.userService.getUserByWalletAddress(walletAddress);
            if (!user) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'User not found'
                });
            }
            return UserSchema.parse(user);
        })
});
