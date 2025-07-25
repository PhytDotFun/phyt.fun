import { TRPCError } from '@trpc/server';
import { FeedPostsSchema, PostSchema } from '@phyt/data-access/models/posts';
import { z } from 'zod';

import { router, protectedProcedure } from '../trpc';

export const postsRouter = router({
    getFeed: protectedProcedure.query(async ({ ctx }) => {
        if (!ctx.userId) {
            throw new TRPCError({
                code: 'UNAUTHORIZED',
                message: 'User ID not found in context'
            });
        }
        const feedPosts = await ctx.postService.getFeed();
        return FeedPostsSchema.parse(feedPosts);
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
            const post = await ctx.postService.getPostByPublicId(postId);
            if (!post) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Post not found'
                });
            }
            return PostSchema.parse(post);
        })
});
