import { router as moduleRouter } from '@phyt/trpc-adapters/trpc';
import { userRouter } from '@phyt/trpc-adapters/users/procedures';

export const apiRouter = moduleRouter({ users: userRouter });

export type ApiRouter = typeof apiRouter;
