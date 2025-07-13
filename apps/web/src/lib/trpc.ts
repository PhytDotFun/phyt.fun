import { QueryClient } from '@tanstack/react-query';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query';
import type { ApiRouter } from '@phyt/hono-gate/router';
import superjson from 'superjson';
import { getAccessToken } from '@privy-io/react-auth';

import { env } from '@/env';

export const queryClient = new QueryClient();

const trpcClient = createTRPCClient<ApiRouter>({
    links: [
        httpBatchLink({
            url: env.VITE_BASE_URL,
            async headers() {
                return {
                    Authorization: `Bearer ${(await getAccessToken()) || ''}`
                };
            },
            transformer: superjson
        })
    ]
});

export const trpc = createTRPCOptionsProxy<ApiRouter>({
    client: trpcClient,
    queryClient
});
