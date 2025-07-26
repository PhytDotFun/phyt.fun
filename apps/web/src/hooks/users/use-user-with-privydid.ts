import { useQuery } from '@tanstack/react-query';

import { getRetryConfig, getRetryDelay } from '@/lib/errors';
import { trpc } from '@/lib/trpc';

export function useUserWithPrivyDID(privyDID: string) {
    return useQuery({
        ...trpc.users.getUserByPrivyDID.queryOptions(privyDID),
        retry: (failureCount, error) => {
            const retryConfig = getRetryConfig(failureCount, error);
            return retryConfig.shouldRetry;
        },
        retryDelay: getRetryDelay
    });
}
