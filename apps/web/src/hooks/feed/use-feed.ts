// import { useQuery } from '@tanstack/react-query';

// import { trpc } from '@/lib/trpc';
// import {
//     getRetryConfig,
//     getRetryDelay,
//     shouldShowLoadingForError,
//     handleGlobalQueryError
// } from '@/lib/error-utils';

// export function useFeed() {
//     const query = useQuery({
//         ...trpc.posts.getFeed.queryOptions({ limit: 20 }),
//         retry: (failureCount, error) => {
//             // Handle UNAUTHORIZED errors (trigger logout)
//             handleGlobalQueryError(error);

//             const retryConfig = getRetryConfig(failureCount, error);
//             return retryConfig.shouldRetry;
//         },
//         retryDelay: getRetryDelay
//     });

//     // For user sync errors, show loading state instead of error
//     if (query.error && shouldShowLoadingForError(query.error)) {
//         return {
//             ...query,
//             data: undefined,
//             error: null,
//             isLoading: true,
//             isError: false,
//             isPending: true
//         };
//     }

//     return query;
// }
