import { useQuery } from '@tanstack/react-query';

import { trpc } from '@/lib/trpc';
import {
    getRetryConfig,
    getRetryDelay,
    shouldShowLoadingForError
} from '@/lib/errors';

export function useCurrentUser() {
    const query = useQuery({
        ...trpc.users.getCurrentUser.queryOptions(),
        retry: (failureCount, error) => {
            const retryConfig = getRetryConfig(failureCount, error);
            return retryConfig.shouldRetry;
        },
        retryDelay: getRetryDelay
    });

    // For user sync errors, show loading state instead of error
    if (query.error && shouldShowLoadingForError(query.error)) {
        return {
            ...query,
            data: undefined,
            error: null,
            isLoading: true,
            isError: false,
            isPending: true
        };
    }

    return query;
}
