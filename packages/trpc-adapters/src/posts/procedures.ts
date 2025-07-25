import { TRPCError } from '@trpc/server';
import {
    PaginatedFeedSchema,
    PostSchema
} from '@phyt/data-access/models/posts';
import { z } from 'zod';

import { router, protectedProcedure } from '../trpc';

export const postsRouter = router({
    getFeed: protectedProcedure
        .input(
            z.object({
                limit: z.number().min(1).max(50).default(20),
                cursor: z.string().optional()
            })
        )
        .query(async ({ ctx, input }) => {
            if (!ctx.userId) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'User ID not found in context'
                });
            }

            const { limit, cursor } = input;
            const paginatedFeed = await ctx.postsService.getFeed(limit, cursor);
            return PaginatedFeedSchema.parse(paginatedFeed);
        }),
    getPostById: protectedProcedure
        .input(z.string())
        .query(async ({ ctx, input }) => {
            const postId = input;

            if (!ctx.userId) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'User ID not found in context'
                });
            }
            const post = await ctx.postsService.getPostByPublicId(postId);
            if (!post) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Post not found'
                });
            }
            return PostSchema.parse(post);
        })
});
