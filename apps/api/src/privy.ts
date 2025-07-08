import { PrivyClient } from '@privy-io/server-auth';
import { env } from './env';

export const privy = new PrivyClient(env.PRIVY_APP_ID, env.PRIVY_SECRET_KEY);
