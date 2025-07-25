import { useQuery } from '@tanstack/react-query';

import { getRetryConfig, getRetryDelay } from '@/lib/error-utils';
import { trpc } from '@/lib/trpc';

export function useUserWithWalletAddress(walletAddress: string) {
    return useQuery({
        ...trpc.users.getUserByWalletAddress.queryOptions(walletAddress),
        retry: (failureCount, error) => {
            const retryConfig = getRetryConfig(failureCount, error);
            return retryConfig.shouldRetry;
        },
        retryDelay: getRetryDelay
    });
}
