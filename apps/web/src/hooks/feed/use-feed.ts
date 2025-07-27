import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { trpc } from '@/lib/trpc';
import {
    shouldShowLoadingForError,
    getRetryConfig,
    getRetryDelay
} from '@/lib/errors';

export function useFeed(limit: number = 20) {
    const query = useInfiniteQuery({
        ...trpc.posts.getFeed.infiniteQueryOptions({ limit }),
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        retry: (failureCount, error) => {
            const config = getRetryConfig(failureCount, error);
            return config.shouldRetry && failureCount < config.maxRetries;
        },
        retryDelay: getRetryDelay,
        staleTime: 30 * 1000, // 30 seconds
        gcTime: 5 * 60 * 1000 // 5 minutes
    });

    // Flatten all posts from all pages into a single array
    const posts = useMemo(() => {
        return query.data?.pages.flatMap((page) => page.posts) ?? [];
    }, [query.data?.pages]);

    // Determine if we should show loading state based on error handling logic
    const isLoading =
        query.isLoading ||
        (query.isError && shouldShowLoadingForError(query.error));

    return {
        // Data
        posts,

        // Pagination
        fetchNextPage: query.fetchNextPage,
        hasNextPage: query.hasNextPage,
        isFetchingNextPage: query.isFetchingNextPage,

        // Loading states
        isLoading,
        isFetching: query.isFetching,
        isRefetching: query.isRefetching,

        // Error handling
        isError: query.isError && !shouldShowLoadingForError(query.error),
        error: query.error,

        // Utilities
        refetch: query.refetch,

        // Raw query data (for advanced use cases)
        data: query.data
    };
}
