import { QueryClient } from '@tanstack/react-query';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query';
import type { ApiRouter } from '@phyt/hono-gateway/router';
import superjson from 'superjson';

import { env } from '@/env';
import { getCachedTokens, clearTokenCache } from '@/lib/utils';

export const queryClient = new QueryClient();

const trpcClient = createTRPCClient<ApiRouter>({
    links: [
        httpBatchLink({
            url: env.VITE_BASE_URL,
            async headers() {
                const { accessToken, idToken } = await getCachedTokens();
                const headers: Record<string, string> = {
                    'Content-Type': 'application/json'
                };

                if (accessToken) {
                    headers['Authorization'] = `Bearer ${accessToken}`;
                }

                if (idToken) {
                    headers['privy-id-token'] = idToken;
                }

                return headers;
            },
            transformer: superjson,
            // Handle 401 errors by clearing stale tokens
            async fetch(url, options) {
                const response = await fetch(url, options);

                // If we get a 401, clear the token cache and retry once
                if (response.status === 401) {
                    console.warn('401 Unauthorized - clearing token cache');
                    clearTokenCache();

                    // Retry the request with fresh tokens
                    const {
                        accessToken: freshAccessToken,
                        idToken: freshIdToken
                    } = await getCachedTokens();

                    // Create new headers object with fresh tokens
                    const newHeaders = new Headers(options?.headers);
                    if (freshAccessToken) {
                        newHeaders.set(
                            'Authorization',
                            `Bearer ${freshAccessToken}`
                        );
                    }
                    if (freshIdToken) {
                        newHeaders.set('privy-id-token', freshIdToken);
                    }

                    const retryOptions = {
                        ...options,
                        headers: newHeaders
                    };

                    return fetch(url, retryOptions);
                }

                return response;
            }
        })
    ]
});

export const trpc = createTRPCOptionsProxy<ApiRouter>({
    client: trpcClient,
    queryClient
});
