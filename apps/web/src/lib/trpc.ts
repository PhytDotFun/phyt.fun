import { QueryClient } from '@tanstack/react-query';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query';
import type { ApiRouter } from '@phyt/hono-gate/router';
import superjson from 'superjson';
import { getAccessToken } from '@privy-io/react-auth';

export const queryClient = new QueryClient();

const trpcClient = createTRPCClient<ApiRouter>({
    links: [
        httpBatchLink({
            url: 'http://localhost:5173',
            async headers() {
                return {
                    Authroization: `Bearer ${(await getAccessToken()) || ''}`
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
