import type { Dependencies } from '@phyt/core/di';
import { db } from '@phyt/data-access/db/client';
import { getRedisClient } from '@phyt/redis/client';
import { PrivyClient } from '@privy-io/server-auth';

import { env } from './env';

const privy = new PrivyClient(env.PRIVY_APP_ID, env.PRIVY_SECRET_KEY);

export const dependencies: Dependencies = {
    db,
    redis: getRedisClient(),
    privy
};
