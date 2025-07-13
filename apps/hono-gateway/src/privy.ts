import { PrivyClient } from '@privy-io/server-auth';

import { env } from './env';

const privy = new PrivyClient(env.PRIVY_APP_ID, env.PRIVY_SECRET_KEY);

export default privy;
