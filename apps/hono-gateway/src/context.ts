import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import type { Context } from 'hono';
import type { AppContext } from '@phyt/trpc-adapters/trpc';

import type { HonoEnv } from './middleware/auth';
import { dependencies } from './di';

export const createContext = (
    _opts: FetchCreateContextFnOptions,
    c: Context<HonoEnv>
): AppContext => ({
    ...dependencies,
    authClaims: c.get('authClaims')
});
