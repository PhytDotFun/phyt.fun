import { TRPCError } from '@trpc/server';
import { UserProfileSchema } from '@phyt/data-access/models/users';
import { z } from 'zod';

import { router, protectedProcedure } from '../trpc';

import { UserService } from './service';

export const userRouter = router({
    getCurrentUser: protectedProcedure.query(async ({ ctx }) => {
        const svc = new UserService(ctx);
        if (!ctx.userId) {
            throw new TRPCError({
                code: 'UNAUTHORIZED',
                message: 'User ID not found in context'
            });
        }
        const currentUser = await svc.getUserByPrivyDID(ctx.userId);
        if (!currentUser) {
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Error fetching user'
            });
        }
        return UserProfileSchema.parse(currentUser);
    }),
    getUserByPrivyDID: protectedProcedure
        .input(z.string().startsWith('did:privy:'))
        .query(async ({ ctx, input }) => {
            const privyDID = input;

            const svc = new UserService(ctx);
            if (!ctx.userId) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'User ID not found in context'
                });
            }
            const user = await svc.getUserByPrivyDID(privyDID);
            if (!user) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Error fetching user'
                });
            }
            return UserProfileSchema.parse(user);
        }),
    getUserByWalletAddress: protectedProcedure
        .input(z.string())
        .query(async ({ ctx, input }) => {
            const walletAddress = input;

            const svc = new UserService(ctx);
            if (!ctx.userId) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'User ID not found in context'
                });
            }
            const user = await svc.getUserByWalletAddress(walletAddress);
            if (!user) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'User not found'
                });
            }
            return UserProfileSchema.parse(user);
        })
});
