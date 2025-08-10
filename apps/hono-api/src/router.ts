import { router as moduleRouter } from '@phyt/trpc-adapters/trpc';
import { usersRouter } from '@phyt/trpc-adapters/users/procedures';
import { postsRouter } from '@phyt/trpc-adapters/posts/procedures';

export const apiRouter = moduleRouter({
    users: usersRouter,
    posts: postsRouter
});

export type ApiRouter = typeof apiRouter;
